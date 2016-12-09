import { EC2 } from 'aws-sdk';

export const ec2InstanceList = async () => {
  const instances = await new EC2({ apiVersion: '2014-11-13' })
    .describeInstances({})
    .promise();

  return instances.Reservations
    .map((reservation) => reservation.Instances)
    .reduce((result, instances) => result.concat(instances), [])
    .filter((instance) => instance.State.Name === 'running');
}

export const ec2InstanceCreate = async ({ cluster }) => {
  const runInstanceRequest = {
    // amazon docker machine image, see http://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html
    ImageId: 'ami-a1491ad2',

    // need to connect this instance to the cluster using the ecs-agent http://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-agent-config.html
    UserData: Buffer.from(`#!/bin/sh\necho ECS_CLUSTER=${cluster} > /etc/ecs/ecs.config\n`).toString('base64'),

    // the instance profile created by our IAM script
    IamInstanceProfile: {
      Name: 'ecsInstanceRole'
    },

    InstanceType: 't2.micro',
    MinCount: 1,
    MaxCount: 1,
  };

  const response = await new EC2({ apiVersion: '2016-11-15' })
    .runInstances(runInstanceRequest)
    .promise();

  return response.Instances;
}
