/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./utils/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://hiredai_owner:nYuRzC1xH4gS@ep-gentle-shape-a1v63dkf.ap-southeast-1.aws.neon.tech/hiredai?sslmode=require",
  },
};
