import { Channel } from "amqplib";
import { postDBModel } from "../database/models";

export const RPCObserver = async (RPC_QUEUE_NAME: string, channel: Channel) => {
    await channel.assertQueue(RPC_QUEUE_NAME, {
        durable: false,
    });
    channel.prefetch(1);
    channel.consume(
        RPC_QUEUE_NAME,
        async (message: any) => {
            if (message.content) {
                const postId = message.content.toString();
                // DB Operation
                let response = {
                    event: "POST_NOT_FOUND",
                    isDisabledInteractions: false,
                };
                try {
                    const getPostDetails = await postDBModel.findOne({ _id: postId });
                    console.log('>>>>>>>>>>>>>>>>>>>>>', getPostDetails);
                    response = getPostDetails ? {
                        event: "POST_FOUND",
                        isDisabledInteractions: getPostDetails.isDisabledInteractions,
                    } : response;
                } catch (error) {
                    console.error(`Error: ${error}`);
                }
                console.log(response);
                channel.sendToQueue(
                    message.properties.replyTo,
                    Buffer.from(JSON.stringify(response)),
                    {
                        correlationId: message.properties.correlationId,
                    }
                );
                channel.ack(message);
            }
        },
        {
            noAck: false,
        }
    );
};