import { useState } from 'react';
import { useForm } from '@mantine/form';
import {
  ActionIcon,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Loader,
  Menu,
  Modal,
  PasswordInput,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconInfoCircle, IconLogout, IconUser, IconUserCircle, IconUsers, IconUserCheck } from '@tabler/icons-react';
import { api, ApiError, type UserProfile } from '../api/client';
import { useAuth } from '../../app/providers/auth-context';

type AuthMode = 'login' | 'register';

export const AccountPanel = () => {
  const { user, loading, login, register, logout } = useAuth();
  const [loginOpened, loginControls] = useDisclosure(false);
  const [profileOpened, profileControls] = useDisclosure(false);
  const [staffOpened, staffControls] = useDisclosure(false);
  const [pendingEmployees, setPendingEmployees] = useState<UserProfile[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [activatingUserId, setActivatingUserId] = useState<number | null>(null);
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm({
    initialValues: { fullName: '', email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Введите корректный email'),
      password: (value) => (value.length >= 8 ? null : 'Минимум 8 символов'),
    },
  });

  const openAuth = () => {
    setMode('login');
    setError(null);
    setNotice(null);
    loginControls.open();
  };

  const signIn = async (values: typeof form.values) => {
    setError(null);
    setNotice(null);
    try {
      await login(values.email.trim(), values.password);
      form.reset();
      loginControls.close();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Не удалось войти. Попробуйте ещё раз.');
    }
  };

  const signUp = async (values: typeof form.values) => {
    setError(null);
    setNotice(null);
    if (!values.fullName.trim()) {
      setError('Введите имя.');
      return;
    }
    try {
      await register(values.fullName.trim(), values.email.trim(), values.password);
      setMode('login');
      form.setValues({ email: values.email, password: '', fullName: '' });
      setNotice('Аккаунт создан. Дождитесь активации администратором, затем войдите.');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Не удалось зарегистрироваться. Попробуйте ещё раз.');
    }
  };

  const signOut = async () => {
    await logout();
    profileControls.close();
  };

  const loadPendingEmployees = async () => {
    setStaffLoading(true);
    setStaffError(null);
    try {
      setPendingEmployees(await api.getEmployees(false));
    } catch (cause) {
      setStaffError(cause instanceof ApiError ? cause.message : 'Не удалось загрузить список сотрудников.');
    } finally {
      setStaffLoading(false);
    }
  };

  const activateEmployee = async (employeeId: number) => {
    setActivatingUserId(employeeId);
    setStaffError(null);
    try {
      await api.updateUserActivation(employeeId, true);
      setPendingEmployees((current) => current.filter((employee) => employee.id !== employeeId));
    } catch (cause) {
      setStaffError(cause instanceof ApiError ? cause.message : 'Не удалось активировать сотрудника.');
    } finally {
      setActivatingUserId(null);
    }
  };

  const initials = user?.full_name.trim().slice(0, 1).toUpperCase() ?? '';
  const submit = form.onSubmit(mode === 'login' ? signIn : signUp);

  return (
    <>
      {user ? (
        <>
          <Menu position="bottom-end" shadow="md" width={190}>
            <Menu.Target>
              <Button className="profile-trigger" variant="subtle" rightSection={<IconChevronDown size={14} />} visibleFrom="sm">
                <Avatar className="profile-avatar" size={27} radius="xl" mr={8}>{initials}</Avatar>
                <span className="profile-trigger-label">Профиль</span>
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconUser size={16} />} onClick={profileControls.open}>Мой профиль</Menu.Item>
              {user.role === 2 && (
                <Menu.Item
                  leftSection={<IconUsers size={16} />}
                  onClick={() => { staffControls.open(); void loadPendingEmployees(); }}
                >
                  Активация сотрудников
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={() => void signOut()}>Выйти</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <ActionIcon
            className="mobile-account-button"
            hiddenFrom="sm"
            variant="light"
            radius="xl"
            size="lg"
            aria-label="Открыть профиль"
            onClick={profileControls.open}
          >
            <Avatar className="profile-avatar" size={29} radius="xl">{initials}</Avatar>
          </ActionIcon>
        </>
      ) : (
        <>
          <Button className="login-button" leftSection={<IconUserCircle size={18} />} variant="default" visibleFrom="sm" loading={loading} onClick={openAuth}>
            Войти
          </Button>
          <ActionIcon
            className="mobile-account-button"
            hiddenFrom="sm"
            variant="light"
            radius="xl"
            size="lg"
            aria-label="Войти"
            disabled={loading}
            onClick={openAuth}
          >
            <IconUserCircle size={19} />
          </ActionIcon>
        </>
      )}

      <Modal
        opened={loginOpened}
        onClose={loginControls.close}
        title={mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
        centered
        radius="lg"
      >
        <form onSubmit={submit}>
          <Stack gap="md">
            {notice && <Alert color="teal" variant="light" icon={<IconInfoCircle size={18} />}>{notice}</Alert>}
            {error && <Alert color="red" variant="light">{error}</Alert>}
            {mode === 'register' && (
              <TextInput
                label="Имя и фамилия"
                placeholder="Иван Иванов"
                autoComplete="name"
                required
                {...form.getInputProps('fullName')}
              />
            )}
            <TextInput
              label="Email"
              placeholder="name@company.ru"
              autoComplete="email"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Пароль"
              placeholder={mode === 'register' ? 'Не менее 8 символов' : 'Введите пароль'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              {...form.getInputProps('password')}
            />
            <Button className="primary-button form-submit" type="submit" leftSection={<IconUser size={17} />}>
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
            <Divider />
            <Text ta="center" size="sm" c="dimmed">
              {mode === 'login' ? 'Впервые здесь? ' : 'Уже есть аккаунт? '}
              <Anchor
                component="button"
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                  setNotice(null);
                }}
              >
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Modal>

      <Modal opened={profileOpened} onClose={profileControls.close} title="Мой профиль" centered radius="lg">
        {user && (
          <Stack gap="lg">
            <Group gap="md" wrap="nowrap">
              <Avatar className="profile-avatar profile-avatar-large" size={56} radius="xl">{initials}</Avatar>
              <div>
                <Text fw={650} c="#243650">{user.full_name}</Text>
                <Text size="sm" c="dimmed" mt={3}>{user.email}</Text>
              </div>
            </Group>
            <Divider />
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" c="dimmed">Роль</Text>
                <Badge mt={5} color={user.role === 2 ? 'violet' : 'blue'} variant="light">
                  {user.role === 2 ? 'Администратор' : 'Сотрудник'}
                </Badge>
              </div>
              <Button variant="default" leftSection={<IconLogout size={16} />} onClick={() => void signOut()}>Выйти</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal opened={staffOpened} onClose={staffControls.close} title="Активация сотрудников" centered radius="lg" size="md">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">Новые сотрудники смогут войти после активации аккаунта.</Text>
          {staffError && <Alert color="red" variant="light">{staffError}</Alert>}
          {staffLoading ? (
            <Group justify="center" py="lg"><Loader size="sm" /><Text size="sm" c="dimmed">Загружаем сотрудников…</Text></Group>
          ) : pendingEmployees.length === 0 ? (
            <Paper className="empty-state" withBorder radius="md" p="lg" ta="center">
              <Text fw={600} size="sm">Нет сотрудников, ожидающих активации</Text>
            </Paper>
          ) : (
            pendingEmployees.map((employee) => (
              <Paper key={employee.id} className="employee-row" withBorder radius="md" p="sm">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <Avatar className="profile-avatar" radius="xl">{employee.full_name.trim().slice(0, 1).toUpperCase()}</Avatar>
                    <div className="employee-identity">
                      <Text fw={600} size="sm" truncate>{employee.full_name}</Text>
                      <Text size="xs" c="dimmed" truncate>{employee.email}</Text>
                    </div>
                  </Group>
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<IconUserCheck size={15} />}
                    loading={activatingUserId === employee.id}
                    onClick={() => void activateEmployee(employee.id)}
                  >
                    Активировать
                  </Button>
                </Group>
              </Paper>
            ))
          )}
        </Stack>
      </Modal>
    </>
  );
};
