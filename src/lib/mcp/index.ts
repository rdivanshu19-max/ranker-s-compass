import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfileTool from "./tools/get-my-profile";
import listMyTestResultsTool from "./tools/list-my-test-results";
import logStudySessionTool from "./tools/log-study-session";
import listStudyAppsTool from "./tools/list-study-apps";
import listTestSeriesTool from "./tools/list-test-series";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ranker-s-compass",
  title: "Ranker's Compass",
  version: "0.1.0",
  instructions:
    "Tools for Rankers Star, a JEE/NEET study platform. Read the signed-in student's profile and test results, log study sessions, and browse the study apps and test series catalog.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfileTool,
    listMyTestResultsTool,
    logStudySessionTool,
    listStudyAppsTool,
    listTestSeriesTool,
  ],
});
