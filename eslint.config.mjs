import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 실험·변환용 일회성 스크립트. .gitignore에도 들어 있어 배포에 포함되지 않는다.
    "tmp/**",
  ]),
  {
    // Next.js가 CommonJS로 읽는 설정 파일이라 require가 정상이다.
    files: ["next.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);

export default eslintConfig;
