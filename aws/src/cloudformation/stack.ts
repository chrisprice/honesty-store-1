import { CloudFormation } from 'aws-sdk';
import { readFileSync } from 'fs';
import * as winston from 'winston';

const createOrUpdateStack = async ({ name, templateName, params }) => {
  const cloudFormation = new CloudFormation({
    apiVersion: '2010-05-15',
    s3ForcePathStyle: true
  });

  const createUpdateParams = {
    StackName: name,
    TemplateBody: readFileSync(templateName, 'utf8'),
    Parameters: Object.keys(params)
      .map((key) => ({
        ParameterKey: key,
        ParameterValue: params[key]
      })),
    Capabilities: ['CAPABILITY_IAM']
  };

  try {

    const createResponse = await cloudFormation.createStack(createUpdateParams)
      .promise();
    winston.debug(`stack: createStack`, createResponse.StackId);
    await cloudFormation.waitFor('stackCreateComplete', { StackName: name })
      .promise();

  } catch (e) {
    if (e.code !== 'AlreadyExistsException') {
      throw e;
    }

    try {
      const updateResponse = await cloudFormation.updateStack(createUpdateParams)
        .promise();
      winston.debug(`stack: updateStack`, updateResponse.StackId);
      await cloudFormation.waitFor('stackUpdateComplete', { StackName: name })
        .promise();
    } catch (e) {
      if (e.code !== 'ValidationError' || e.message !== 'No updates are to be performed.') {
        throw e;
      }
    }
  }

  const describeResponse = await cloudFormation.describeStacks({ StackName: name })
    .promise();

  return describeResponse.Stacks[0].Outputs.reduce<any>(
    (object, output) => {
      object[output.OutputKey] = output.OutputValue;
      return object;
    },
    {}
  );
};

const deleteStack = async ({ name }) => {
  await new CloudFormation({ apiVersion: '2010-05-15' })
    .deleteStack({
      StackName: name
    })
    .promise();
};

export const ensureStack = async ({ name, templateName, params }) => {
  try {
    await createOrUpdateStack({ name, templateName, params });
  } catch (e) {
    if (e.code !== 'ValidationError' || e.message.indexOf('is in ROLLBACK_COMPLETE state') === -1) {
      throw e;
    }

    await deleteStack({ name });
    await createOrUpdateStack({ name, templateName, params });
  }
};
