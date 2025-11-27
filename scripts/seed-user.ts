import { auth } from '@_/infra.auth';

(async () => {
  try {
    await auth.api.createUser({
      body: {
        email: 'sudo@sudo.sudo',
        password: 'sudo',
        name: 'sudo',
        role: ['admin', 'user'],
      },
    });
  } catch {}
})();
