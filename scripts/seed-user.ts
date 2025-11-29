// biome-ignore lint/suspicious/noTsIgnore: I don't give a fuck.
// @ts-ignore
import { auth } from '@_/features/auth';

(async () => {
  try {
    await auth.api.createUser({
      body: {
        email: 'super@user.com',
        password: 'superuserdo',
        name: 'sudo',
        role: ['admin', 'user'],
      },
    });
  } catch {}
})();
