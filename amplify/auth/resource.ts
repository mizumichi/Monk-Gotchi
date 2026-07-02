import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: '【HI-T-TREE】認証コードのご案内',
      verificationEmailBody: (createCode) =>
        `以下の認証コードを入力してください。

認証コード: ${createCode()}

このコードは10分間有効です。
心当たりのない場合は、このメールを無視してください。`,
    },
  },
});