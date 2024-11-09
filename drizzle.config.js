/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./utils/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://ai-interview_owner:5aXEgHMmi6ST@ep-ancient-lab-a5vsbeh5.us-east-2.aws.neon.tech/ai-interview?sslmode=require",
  },
};
