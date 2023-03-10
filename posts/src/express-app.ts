import express, { json, urlencoded, Express } from "express";
import cors from "cors";
import { postRoutes } from "./routes";
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from "path";
import { RPCObserver } from "./utils/rpc";
import { configuration } from "./config";
const { INTERACTION_QUEUE } = configuration;
const swaggerDocument = YAML.load(path.resolve(__dirname, '../swagger.yaml'));


export default async (app: Express, channel: any) => {
  app.use(json({ limit: "1mb" }));
  app.use(urlencoded({ extended: true, limit: "1mb" }));
  app.use(cors());
  app.use(express.static(__dirname + "/public"));
  app.use("/images", express.static(__dirname + "/asset/images"));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Added comment

  // LISTEN to EVENTS

  // Routes
  postRoutes(app, channel);
  RPCObserver(INTERACTION_QUEUE, channel);

  //ERROR HANDLING
  //   app.use(HandleError);
};
