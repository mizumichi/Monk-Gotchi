import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
    },
  },
  userVerification: {
    emailSubject: '【HI-T-TREE】認証コードのご案内',
    emailBody: '以下の認証コードを入力してください。\n\n認証コード: {####}\n\nこのコードは10分間有効です。\n心当たりのない場合は、このメールを無視してください。',
    emailStyle: 'CODE',
  },
});
