import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      displayName: a.string().required(),
      timezone: a.string().required(),
      currentCycleStartDate: a.date().required(),
    })
    .authorization((allow) => [allow.owner()]),

  DailyLog: a
    .model({
      userId: a.string().required(),
      date: a.date().required(),
      taskId: a.string().required(),
      points: a.integer().required(),
      completedAt: a.datetime().required(),
      numericValues: a.json(),
    })
    .authorization((allow) => [allow.owner()]),

  Character: a
    .model({
      userId: a.string().required(),
      cycleStartDate: a.date().required(),
      stage: a.string().required(),
      midType: a.string(),
      finalType: a.string(),
      categoryScores: a.json().required(),
    })
    .authorization((allow) => [allow.owner()]),

  CharacterDex: a
    .model({
      characterType: a.string().required(),
      firstObtainedAt: a.datetime().required(),
      lastObtainedAt: a.datetime().required(),
      obtainedCount: a.integer().required().default(1),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
