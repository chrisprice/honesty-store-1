import { getItem } from '../../item/src/client';
import { createServiceKey } from '../../service/src/key';
import { Survey } from './client';

const internalSurveys: Survey[] = [
  {
    id: 'a058216e-b7ca-4d7f-a846-f7bdbe05a923',
    priority: 100,
    questions: [
      [
        '46ced0c0-8815-4ed2-bfb6-40537f5bd512',
        'faeda516-bd9f-41ec-b949-7a676312b0ae'
      ],
      [
        'b43c4a97-1112-41ce-8f91-5a8bda0dcdc8',
        '78816fba-150d-4282-b43d-900df45cea8b'
      ]
    ]
  },
  {
    id: '15f4e4cb-eff8-4189-9d72-b53208e73431',
    priority: 99,
    questions: [
      [
        'b43c4a97-1112-41ce-8f91-5a8bda0dcdc8',
        'faeda516-bd9f-41ec-b949-7a676312b0ae'
      ],
      [
        '46ced0c0-8815-4ed2-bfb6-40537f5bd512',
        '78816fba-150d-4282-b43d-900df45cea8b'
      ]
    ]
  }
];

const surveys = new Map<string, Survey>();
const key = createServiceKey({ service: 'survey-init' });

for (const survey of internalSurveys) {
  if (surveys.has(survey.id)) {
    throw new Error(`Duplicate ID ${survey.id}`);
  }

  for (const [ itemIdA, itemIdB ] of survey.questions) {
    // ensure the itemIDs are valid
    Promise.all([
      getItem(key, itemIdA),
      getItem(key, itemIdB)
    ])
      .then(() => void 0)
      .catch(e => { throw e; });
  }

  surveys.set(survey.id, survey);
}

export const getSurveys = () => [...surveys.values()];

export const getSurvey = (id: string) => {
  const survey = surveys.get(id);
  if (survey == null) {
    throw new Error(`Survey does not exist with ID '${id}'`);
  }
  return survey;
};
