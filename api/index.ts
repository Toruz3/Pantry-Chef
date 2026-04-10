import app from "../src/server/app";

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function (req: any, res: any) {
  return app(req, res);
}
