"""HTTP integration checks for the FastAPI backend.

Run from ``backend/`` with the API already running:
    python script_test.py

The suite uses the configured admin account and creates uniquely named test
records in the configured database, then removes only those records directly
after the HTTP checks. Pass ``--keep-data`` to preserve them. Credentials and URL
can be overridden with ADMIN_EMAIL, ADMIN_PASSWORD and API_BASE_URL environment
variables.
"""

from __future__ import annotations

import os
import sys
import uuid
from dataclasses import dataclass
from typing import Any, Callable

import requests


BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "test@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "testpassword123")
TIMEOUT = float(os.getenv("API_TIMEOUT", "8"))
RUN_ID = uuid.uuid4().hex[:10]
KEEP_DATA = "--keep-data" in sys.argv
CREATED_USER_IDS: list[int] = []
CREATED_TRIP_IDS: list[int] = []
CREATED_EXPENSE_IDS: list[int] = []
ISSUED_REFRESH_TOKENS: list[str] = []


@dataclass
class TestReport:
    passed: int = 0
    failed: int = 0

    def ok(self, name: str) -> None:
        self.passed += 1
        print(f"[ PASS ] {name}")

    def fail(self, name: str, reason: str) -> None:
        self.failed += 1
        print(f"[ FAIL ] {name}: {reason}")


report = TestReport()


def check(name: str, operation: Callable[[], Any]) -> Any:
    """Run one check, report it, and continue with independent checks."""
    try:
        result = operation()
    except requests.RequestException:
        raise
    except Exception as exc:
        report.fail(name, str(exc))
        return None
    report.ok(name)
    return result


def expect_status(response: requests.Response, expected: int) -> requests.Response:
    if response.status_code != expected:
        try:
            body = response.json()
        except ValueError:
            body = response.text[:300]
        raise AssertionError(f"expected HTTP {expected}, got {response.status_code}: {body}")
    return response


def request(
    method: str,
    path: str,
    *,
    token: str | None = None,
    json: dict[str, Any] | None = None,
    expected: int = 200,
    session: requests.Session | None = None,
) -> requests.Response:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    client = session or requests
    response = client.request(
        method,
        f"{BASE_URL}{path}",
        headers=headers,
        json=json,
        timeout=TIMEOUT,
    )
    return expect_status(response, expected)


def get_tokens(email: str, password: str, expected: int = 200) -> dict[str, str] | None:
    response = request(
        "POST",
        "/auth/login/",
        json={"email": email, "password": password},
        expected=expected,
    )
    if expected != 200:
        return None
    payload = response.json()
    for key in ("access_token", "refresh_token"):
        if not isinstance(payload.get(key), str) or not payload[key]:
            raise AssertionError(f"login response has no {key}")
    if payload.get("token_type") != "bearer":
        raise AssertionError("login response token_type is not bearer")
    ISSUED_REFRESH_TOKENS.append(payload["refresh_token"])
    return payload


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def cleanup_test_records() -> None:
    """Remove only rows created by this run, including its refresh-token hashes."""
    if not any((CREATED_USER_IDS, CREATED_TRIP_IDS, CREATED_EXPENSE_IDS, ISSUED_REFRESH_TOKENS)):
        return

    from app.core.security import hash_token
    from app.db.database import SessionLocal
    from app.models import models

    db = SessionLocal()
    try:
        if CREATED_EXPENSE_IDS:
            db.query(models.Expense).filter(models.Expense.id.in_(CREATED_EXPENSE_IDS)).delete(synchronize_session=False)
        if CREATED_TRIP_IDS:
            db.query(models.Trip).filter(models.Trip.id.in_(CREATED_TRIP_IDS)).delete(synchronize_session=False)
        token_hashes = [hash_token(token) for token in ISSUED_REFRESH_TOKENS]
        if token_hashes:
            db.query(models.RefreshToken).filter(models.RefreshToken.token_hash.in_(token_hashes)).delete(synchronize_session=False)
        if CREATED_USER_IDS:
            db.query(models.User).filter(models.User.id.in_(CREATED_USER_IDS)).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def run() -> None:
    print(f"Backend API integration checks: {BASE_URL}")
    print(f"Run ID: {RUN_ID}")

    check("root health endpoint", lambda: request("GET", "/", expected=200))

    def check_openapi() -> None:
        spec = request("GET", "/openapi.json", expected=200).json()
        paths = spec.get("paths", {})
        expected_paths = {
            "/auth/register/", "/auth/login/", "/auth/refresh/", "/auth/logout/", "/auth/me/",
            "/trips/", "/trips/{trip_id}", "/expenses/", "/expenses/{expense_id}",
            "/expenses/{expense_id}/review", "/trips/{trip_id}/expenses",
            "/users/", "/users/{user_id}/activation/",
        }
        missing = sorted(expected_paths - paths.keys())
        require(not missing, f"OpenAPI is missing routes: {', '.join(missing)}")

    check("OpenAPI exposes auth, trips and expenses routes", check_openapi)
    check("admin login rejects a wrong password", lambda: get_tokens(ADMIN_EMAIL, "definitely-wrong", 401))

    admin_tokens = check("configured administrator can log in", lambda: get_tokens(ADMIN_EMAIL, ADMIN_PASSWORD))
    if admin_tokens is None:
        print("Admin login failed; protected resource checks are skipped.")
    else:
        admin_access = admin_tokens["access_token"]
        check("protected trips endpoint rejects a missing token", lambda: request("GET", "/trips/", expected=401))
        check("current-user endpoint rejects a missing token", lambda: request("GET", "/auth/me/", expected=401))
        check(
            "protected trips endpoint rejects a malformed token",
            lambda: request("GET", "/trips/", token="not.a.jwt", expected=401),
        )
        check(
            "current-user endpoint rejects a malformed token",
            lambda: request("GET", "/auth/me/", token="not.a.jwt", expected=401),
        )
        check(
            "access endpoint rejects a refresh token",
            lambda: request("GET", "/trips/", token=admin_tokens["refresh_token"], expected=401),
        )

        def current_admin_profile() -> None:
            profile = request("GET", "/auth/me/", token=admin_access).json()
            require(profile.get("email") == ADMIN_EMAIL and profile.get("role") == 2,
                    f"unexpected current administrator profile: {profile}")
            require("hashed_password" not in profile, "current-user response leaked the password hash")

        check("current-user endpoint returns the authenticated administrator", current_admin_profile)

        # Registration creates an inactive employee in the current API.
        employee_email = f"api-test-{RUN_ID}@example.com"
        employee_password = f"T-{uuid.uuid4().hex}"

        def register_employee() -> dict[str, Any]:
            response = request(
                "POST", "/auth/register/", expected=201,
                json={"email": employee_email, "full_name": "API Integration Test", "password": employee_password},
            )
            payload = response.json()
            require(payload.get("email") == employee_email and payload.get("role") == 1,
                    f"unexpected registered user response: {payload}")
            require(payload.get("is_active") is False and "hashed_password" not in payload,
                    "registration did not return a safe inactive employee response")
            return payload

        employee = check("registration creates an inactive employee safely", register_employee)
        if employee:
            CREATED_USER_IDS.append(employee["id"])
            check(
                "employee directory requires administrator authentication",
                lambda: request("GET", "/users/?is_active=false", expected=401),
            )
            check(
                "admin sees the newly registered employee in pending list",
                lambda: require(any(
                    item.get("id") == employee["id"]
                    for item in request("GET", "/users/?is_active=false", token=admin_tokens["access_token"]).json()
                ), "new employee is absent from administrator's pending list"),
            )
        check(
            "duplicate email registration returns 409",
            lambda: request(
                "POST", "/auth/register/", expected=409,
                json={"email": employee_email, "full_name": "Duplicate", "password": employee_password},
            ),
        )
        check("inactive employee login returns 403", lambda: get_tokens(employee_email, employee_password, 403))
        employee_id = employee["id"] if employee else None
        if employee_id is not None:
            check(
                "activation endpoint rejects a missing admin token",
                lambda: request("PATCH", f"/users/{employee_id}/activation/", expected=401,
                                json={"is_active": True}),
            )
            activation = check(
                "admin activates a registered employee",
                lambda: request("PATCH", f"/users/{employee_id}/activation/", token=admin_tokens["access_token"],
                                json={"is_active": True}),
            )
            if activation:
                require(activation.json().get("is_active") is True,
                        "activation response did not mark employee active")
            employee_tokens = check(
                "activated employee can log in",
                lambda: get_tokens(employee_email, employee_password),
            )
            if employee_tokens:
                def current_employee_profile() -> None:
                    profile = request("GET", "/auth/me/", token=employee_tokens["access_token"]).json()
                    require(profile.get("id") == employee_id and profile.get("email") == employee_email
                            and profile.get("role") == 1 and profile.get("is_active") is True,
                            f"unexpected current employee profile: {profile}")
                    require("hashed_password" not in profile, "current-user response leaked the password hash")

                check("current-user endpoint returns the authenticated employee", current_employee_profile)
                check(
                    "employee cannot view the user directory",
                    lambda: request(
                        "GET", "/users/", token=employee_tokens["access_token"], expected=403,
                    ),
                )
        else:
            employee_tokens = None

        # A second session allows refresh/logout checks without invalidating the
        # access token used below for the CRUD suite.
        lifecycle_tokens = check("second admin login creates a separate token pair",
                                 lambda: get_tokens(ADMIN_EMAIL, ADMIN_PASSWORD))
        if lifecycle_tokens:
            rotated = check(
                "refresh rotates the refresh token pair",
                lambda: request(
                    "POST", "/auth/refresh/", json={"refresh_token": lifecycle_tokens["refresh_token"]},
                ).json(),
            )
            if rotated:
                check(
                    "rotated refresh token differs from the old token",
                    lambda: require(rotated["refresh_token"] != lifecycle_tokens["refresh_token"],
                                    "refresh token was not rotated"),
                )
                check(
                    "old refresh token cannot be reused",
                    lambda: request("POST", "/auth/refresh/",
                                    json={"refresh_token": lifecycle_tokens["refresh_token"]}, expected=401),
                )
                check(
                    "logout revokes the current refresh token",
                    lambda: request("POST", "/auth/logout/",
                                    json={"refresh_token": rotated["refresh_token"]}, expected=204),
                )
                check(
                    "logged-out refresh token cannot be reused",
                    lambda: request("POST", "/auth/refresh/",
                                    json={"refresh_token": rotated["refresh_token"]}, expected=401),
                )
            check(
                "refresh endpoint rejects an access token",
                lambda: request("POST", "/auth/refresh/",
                                json={"refresh_token": lifecycle_tokens["access_token"]}, expected=401),
            )

        check(
            "refresh endpoint rejects a malformed request",
            lambda: request("POST", "/auth/refresh/", json={"refresh_token": "bad-token"}, expected=401),
        )

        check(
            "trip creation rejects a negative budget",
            lambda: request("POST", "/trips/", token=admin_access, expected=422,
                            json={"title": "Invalid budget", "description": None, "budget": "-1"}),
        )

        def create_trip() -> dict[str, Any]:
            payload = request(
                "POST", "/trips/", token=admin_access, expected=201,
                json={"title": f"[API TEST {RUN_ID}] Trip", "description": "Created by script_test.py", "budget": "1250.50"},
            ).json()
            require(payload.get("title") == f"[API TEST {RUN_ID}] Trip" and payload.get("budget") == "1250.50",
                    f"unexpected trip response: {payload}")
            return payload

        trip = check("admin creates a trip", create_trip)
        if trip:
            trip_id = trip["id"]
            CREATED_TRIP_IDS.append(trip_id)
            check(
                "trip appears in the trip list",
                lambda: require(any(item.get("id") == trip_id for item in
                                    request("GET", "/trips/", token=admin_access).json()),
                                "created trip is absent from trip list"),
            )
            check("trip can be read by id", lambda: request("GET", f"/trips/{trip_id}", token=admin_access))
            check("unknown trip returns 404", lambda: request("GET", "/trips/2147483647", token=admin_access, expected=404))
            check(
                "trip can be partially updated",
                lambda: request("PATCH", f"/trips/{trip_id}", token=admin_access,
                                json={"budget": "1400.00"}),
            )
            check(
                "expense creation rejects a missing trip",
                lambda: request("POST", "/expenses/", token=admin_access, expected=404,
                                json={"title": "Unknown trip", "amount": "1.00", "trip_id": 2147483647}),
            )
            check(
                "expense creation rejects a non-positive amount",
                lambda: request("POST", "/expenses/", token=admin_access, expected=422,
                                json={"title": "Invalid amount", "amount": "0", "trip_id": trip_id}),
            )

            if employee_tokens and employee_id is not None:
                employee_access = employee_tokens["access_token"]
                check(
                    "employee trip list excludes another user's trip",
                    lambda: require(
                        all(item.get("id") != trip_id for item in request(
                            "GET", "/trips/", token=employee_access
                        ).json()),
                        "employee can see an administrator's trip",
                    ),
                )
                check(
                    "employee cannot read another user's trip",
                    lambda: request("GET", f"/trips/{trip_id}", token=employee_access, expected=404),
                )
                check(
                    "employee cannot add an expense to another user's trip",
                    lambda: request(
                        "POST", "/expenses/", token=employee_access, expected=404,
                        json={"title": "Cross-user expense", "amount": "2.00", "trip_id": trip_id},
                    ),
                )

                def create_employee_trip() -> dict[str, Any]:
                    payload = request(
                        "POST", "/trips/", token=employee_access, expected=201,
                        json={"title": f"[API TEST {RUN_ID}] Employee trip", "description": None, "budget": "50.00"},
                    ).json()
                    require(payload.get("user_id") == employee_id,
                            "employee trip is not assigned to the logged-in employee")
                    return payload

                own_trip = check("employee creates a trip assigned to their account", create_employee_trip)
                if own_trip:
                    own_trip_id = own_trip["id"]
                    CREATED_TRIP_IDS.append(own_trip_id)
                    check(
                        "employee sees their own trip",
                        lambda: require(
                            any(item.get("id") == own_trip_id for item in request(
                                "GET", "/trips/", token=employee_access
                            ).json()),
                            "employee's own trip is absent from their list",
                        ),
                    )
                    employee_expense = check(
                        "employee creates an expense for their own trip",
                        lambda: request(
                            "POST", "/expenses/", token=employee_access, expected=201,
                            json={"title": f"[API TEST {RUN_ID}] Employee expense", "amount": "5.00", "trip_id": own_trip_id},
                        ).json(),
                    )
                    if employee_expense:
                        CREATED_EXPENSE_IDS.append(employee_expense["id"])
                        check(
                            "employee cannot review an expense",
                            lambda: request(
                                "PATCH", f"/expenses/{employee_expense['id']}/review", token=employee_access,
                                expected=403, json={"status": 1},
                            ),
                        )
                        check(
                            "employee can delete their own pending expense",
                            lambda: request("DELETE", f"/expenses/{employee_expense['id']}", token=employee_access, expected=204),
                        )
                check(
                    "employee cannot activate users",
                    lambda: request("PATCH", f"/users/{employee_id}/activation/", token=employee_access,
                                    expected=403, json={"is_active": False}),
                )
                check(
                    "admin deactivates the employee",
                    lambda: request("PATCH", f"/users/{employee_id}/activation/", token=admin_access,
                                    json={"is_active": False}),
                )
                check(
                    "deactivated employee access token is rejected",
                    lambda: request("GET", "/trips/", token=employee_access, expected=403),
                )
                check(
                    "current-user endpoint rejects a deactivated employee",
                    lambda: request("GET", "/auth/me/", token=employee_access, expected=403),
                )
                check(
                    "deactivation revokes employee refresh token",
                    lambda: request("POST", "/auth/refresh/", expected=401,
                                    json={"refresh_token": employee_tokens["refresh_token"]}),
                )

            def create_expense(title: str, amount: str) -> dict[str, Any]:
                payload = request(
                    "POST", "/expenses/", token=admin_access, expected=201,
                    json={"title": f"[API TEST {RUN_ID}] {title}", "amount": amount, "trip_id": trip_id},
                ).json()
                require(payload.get("status") == 0 and payload.get("trip_id") == trip_id,
                        f"unexpected new expense response: {payload}")
                require(payload.get("reviewed_at") is None and payload.get("reviewed_by_id") is None,
                        "pending expense unexpectedly has review metadata")
                return payload

            expense = check("admin creates a pending expense", lambda: create_expense("Approved expense", "24.50"))
            if expense:
                expense_id = expense["id"]
                CREATED_EXPENSE_IDS.append(expense_id)
                check(
                    "expense is listed under its trip",
                    lambda: require(any(item.get("id") == expense_id for item in
                                        request("GET", f"/trips/{trip_id}/expenses", token=admin_access).json()),
                                    "created expense is absent from trip expenses"),
                )
                check(
                    "pending expense can be partially updated",
                    lambda: request("PATCH", f"/expenses/{expense_id}", token=admin_access, json={"amount": "25.00"}),
                )
                check(
                    "rejection without a reason fails validation",
                    lambda: request("PATCH", f"/expenses/{expense_id}/review", token=admin_access,
                                    json={"status": 2}, expected=422),
                )
                check(
                    "admin approves a pending expense",
                    lambda: request("PATCH", f"/expenses/{expense_id}/review", token=admin_access,
                                    json={"status": 1}),
                )
                check(
                    "reviewed expense cannot be edited",
                    lambda: request("PATCH", f"/expenses/{expense_id}", token=admin_access,
                                    json={"amount": "26.00"}, expected=409),
                )
                check(
                    "expense cannot be reviewed twice",
                    lambda: request("PATCH", f"/expenses/{expense_id}/review", token=admin_access,
                                    json={"status": 2, "review_comment": "second review"}, expected=409),
                )
                if employee:
                    check("admin reactivates employee for expense permission check",
                          lambda: request("PATCH", f"/users/{employee['id']}/activation/", token=admin_access,
                                          json={"is_active": True}))
                    active_employee_tokens = check("reactivated employee can log in", lambda: get_tokens(employee_email, employee_password))
                    if active_employee_tokens and own_trip:
                        employee_reviewed_expense = check(
                            "admin approves employee-owned expense",
                            lambda: request("POST", "/expenses/", token=admin_access, expected=201,
                                            json={"title": f"[API TEST {RUN_ID}] Employee approved", "amount": "6.00", "trip_id": own_trip["id"]}).json(),
                        )
                        if employee_reviewed_expense:
                            CREATED_EXPENSE_IDS.append(employee_reviewed_expense["id"])
                            check("admin reviews employee-owned expense",
                                  lambda: request("PATCH", f"/expenses/{employee_reviewed_expense['id']}/review", token=admin_access,
                                                  json={"status": 1}))
                            check("employee cannot delete an approved expense",
                                  lambda: request("DELETE", f"/expenses/{employee_reviewed_expense['id']}", token=active_employee_tokens["access_token"], expected=403))
                rejected = check("admin creates a second pending expense",
                                 lambda: create_expense("Rejected expense", "7.00"))
                if rejected:
                    CREATED_EXPENSE_IDS.append(rejected["id"])
                    check(
                        "admin rejects an expense with a reason",
                        lambda: request("PATCH", f"/expenses/{rejected['id']}/review", token=admin_access,
                                        json={"status": 2, "review_comment": "Missing receipt"}),
                    )
                check("trip with expenses cannot be deleted",
                      lambda: request("DELETE", f"/trips/{trip_id}", token=admin_access, expected=409))
                check("administrator can delete an approved expense",
                      lambda: request("DELETE", f"/expenses/{expense_id}", token=admin_access, expected=204))

        def create_empty_trip() -> dict[str, Any]:
            return request(
                "POST", "/trips/", token=admin_access, expected=201,
                json={"title": f"[API TEST {RUN_ID}] Empty trip", "description": None, "budget": "0.00"},
            ).json()

        empty_trip = check("admin creates a zero-budget trip", create_empty_trip)
        if empty_trip:
            empty_id = empty_trip["id"]
            CREATED_TRIP_IDS.append(empty_id)
            check("empty trip can be deleted",
                  lambda: request("DELETE", f"/trips/{empty_id}", token=admin_access, expected=204))
            check("deleted trip returns 404",
                  lambda: request("GET", f"/trips/{empty_id}", token=admin_access, expected=404))

    if KEEP_DATA:
        print("Test records were kept (--keep-data).")
    else:
        check("test records and issued refresh tokens are cleaned up", cleanup_test_records)

    print("\nTest summary")
    print(f"Passed: {report.passed}")
    print(f"Failed: {report.failed}")
    if report.failed:
        sys.exit(1)
    print("All integration checks passed.")


if __name__ == "__main__":
    try:
        run()
    except requests.RequestException as exc:
        print(f"\nCannot reach API at {BASE_URL}: {exc}", file=sys.stderr)
        print("Start the backend first (from backend/: uvicorn app.main:app --reload).", file=sys.stderr)
        sys.exit(2)
