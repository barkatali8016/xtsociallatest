const { v4: uuid4 } = require("uuid");

const requestData = async (RPC_QUEUE_NAME, postId, uuid, channel) => {
    try {

        const q = await channel.assertQueue("", { exclusive: true });

        channel.sendToQueue(
            RPC_QUEUE_NAME,
            Buffer.from(postId),
            {
                replyTo: q.queue,
                correlationId: uuid,
            }
        );

        return new Promise((resolve, reject) => {
            // timeout 8s
            const timeout = setTimeout(() => {
                channel.close();
                resolve({ event: "ERROR", isDisabledInteractions: false });
            }, 8000);
            channel.consume(
                q.queue,
                (message) => {
                    if (message.properties.correlationId == uuid) {
                        resolve(JSON.parse(message.content.toString()));
                        clearTimeout(timeout);
                    } else {
                        resolve({ event: "ERROR", isDisabledInteractions: false });
                    }
                },
                {
                    noAck: true,
                }
            );
        });
    } catch (error) {
        console.log(error);
        return error;
    }
};

module.exports.RPCRequest = async (RPC_QUEUE_NAME, postId, channel) => {
    const uuid = uuid4(); // correlationId
    return await requestData(RPC_QUEUE_NAME, postId, uuid, channel);
};
