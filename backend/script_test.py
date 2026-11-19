import requests

BASE_URL = "http://127.0.0.1:8000"


def run_tests():
    print("1. Создаем командировку...")
    response = requests.post(f"{BASE_URL}/trips/", json={
        "title": "Тестовая поездка", "description": "Проверка", "budget": 1000
    })
    assert response.status_code == 201, f"Ошибка: {response.text}"
    trip_id = response.json()["id"]
    print(f"✅ Успех! Создана поездка с ID: {trip_id}")

    print("2. Добавляем расход...")
    response = requests.post(f"{BASE_URL}/expenses/", json={
        "title": "Кофе", "amount": 200, "trip_id": trip_id
    })
    assert response.status_code == 201, f"Ошибка: {response.text}"
    print("✅ Расход добавлен!")

    print("3. Проверяем каскадное удаление...")
    requests.delete(f"{BASE_URL}/trips/{trip_id}/")

    response = requests.get(f"{BASE_URL}/trips/{trip_id}/expenses/")
    assert response.json() == [], "Ошибка: расходы не удалились!"
    print("✅ Каскадное удаление работает! База чиста.")


if __name__ == "__main__":
    run_tests()