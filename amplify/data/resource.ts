import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { generateHarvestAdviceFn } from '../functions/generate-harvest-advice/resource';

const schema = a.schema({
  HarvestAdvice: a.customType({
    verdict:    a.string().required(),
    goodPoints: a.string().array().required(),
    advice:     a.string().array().required(),
  }),

  User: a
    .model({
      displayName: a.string().required(),
      timezone: a.string().required(),
      currentCycleStartDate: a.date().required(),
      nickname: a.string(),
      isStatusPublic: a.boolean(),
      hasSeenFriendsIntro: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  PublicProfile: a
    .model({
      userId: a.string().required(),
      nickname: a.string(),
      isStatusPublic: a.boolean(),
      todayXp: a.integer(),
      cycleDay: a.integer(),
      stage: a.string(),
      totalFruits: a.integer(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.owner().to(['create', 'update', 'delete']),
    ]),

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
    })
    .authorization((allow) => [allow.owner()]),

  Harvest: a
    .model({
      harvestedAt: a.datetime().required(),
      cycleStartDate: a.string().required(),
      totalScore: a.integer().required(),
      rank: a.string().required(),
      fruitCount: a.integer().required(),
      aiStatus:      a.string(),
      aiAdvice:      a.json(),
      aiGeneratedAt: a.datetime(),
      aiModel:       a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  generateHarvestAdvice: a
    .mutation()
    .arguments({
      harvestId: a.string().required(),
      summary:   a.json().required(),
    })
    .returns(a.ref('HarvestAdvice'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generateHarvestAdviceFn)),

  UserSettings: a
    .model({
      favoriteTaskIds: a.string().array(),
    })
    .authorization((allow) => [allow.owner()]),

  Journal: a
    .model({
      date: a.date().required(),
      slot: a.string().required(), // 'morning' | 'evening'
      mood: a.integer().required(),
      text: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
})
.authorization((allow) => [
  allow.resource(generateHarvestAdviceFn).to(['mutate']),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
