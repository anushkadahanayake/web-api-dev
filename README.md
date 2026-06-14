# web-api-dev
COBSCCOMP251P-052 - P.D.A.S.M. DAHANAYAKE
BCS25.1P

---

# Enterprise-Grade Node.js + TypeScript Web API

A production-grade, highly scalable, clean, and robust Node.js Web API built with **TypeScript** and **Express.js**.

This project demonstrates a feature-modular (screaming) architecture that keeps components decoupled, highly testable, and security-hardened.

---

## 🏗️ Architecture Design Patterns

This codebase implements several industry-level architecture design patterns:

1. **Modular / Screaming Architecture (Folder-by-Feature)**:
   Instead of using standard global layers (e.g. `controllers/`, `services/`, `models/`), code is grouped under self-contained feature modules (e.g. `src/modules/hello/*`). This facilitates high scalability, clear encapsulation, and easy migration to microservices if needed.
2. **Layered Services Pattern**:
   - **Router Layer**: Directs incoming requests to the designated controllers.
   - **Controller Layer**: Operates as the HTTP adaptor. It processes request metadata and parameter validation, invokes the Service layer, and yields typed JSON responses.
   - **Service Layer**: House for domain/business logic. Entirely decoupled from Express's `req` and `res` contexts, making it independently unit-testable.
3. **Fail-Fast Environment Validation**:
   Uses `Zod` to strictly parse and validate configuration fields in `src/config/environment.ts` at startup. If configurations are incorrect (e.g., non-numeric port), the runtime fails fast with clear errors.
4. **Resilient Error Handling Boundary**:
   Standardized `AppError` base class maps distinct operational exceptions (such as `NotFoundError` and `BadRequestError`). A global Express error-handler middleware intercepts runtime errors, logs the full context, and masks sensitive stacks in production environments.
5. **Robust Production Logging**:
   Winston logger generates clean, formatted, colorized text console output in development, logs structured JSON payloads in production (essential for cloud platforms like Datadog, AWS CloudWatch, or ELK Stack), and operates silently in the test environment.
6. **Graceful Server Shutdown**:
   Listens to process-level signals (`SIGTERM`, `SIGINT`) and runtime exceptions (`uncaughtException`, `unhandledRejection`) to close open HTTP server sockets gracefully before terminating.
7. **Security Hardening Middlewares**:
   - `Helmet`: Configures standard secure HTTP headers to mitigate cross-site scripting (XSS) and injection attacks.
   - `CORS`: Restricts cross-origin resource sharing to trusted configurations.
   - `Express Rate Limit`: Defends endpoints against denial of service (DoS) and brute force attacks.

---

## 📁 Directory Structure

```
.
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline
├── src/
│   ├── config/
│   │   └── environment.ts     # Zod-validated environment config
│   ├── errors/
│   │   ├── app-error.ts       # Custom operational exception classes
│   │   └── error-handler.middleware.ts  # Global Express exception boundary
│   ├── middlewares/
│   │   ├── logger.middleware.ts         # HTTP request logging setup (Morgan + Winston)
│   │   └── rate-limiter.middleware.ts   # Rate limit configuration
│   ├── modules/
│   │   └── hello/             # Self-contained feature module
│   │       ├── hello.controller.ts
│   │       ├── hello.router.ts
│   │       ├── hello.service.ts
│   │       └── hello.test.ts  # Route integration tests
│   ├── utils/
│   │   └── logger.ts          # Structured Winston logger configuration
│   ├── app.ts                 # Express application orchestrator
│   └── server.ts              # HTTP entrypoint & graceful shutdown scripts
├── .env                       # Local environment configurations
├── .env.example               # Config template
├── .gitignore
├── .prettierrc                # Formatting rules
├── eslint.config.js           # ESLint flat configurations
├── tsconfig.json              # Strict compiler configs
├── jest.config.js             # Jest test suite configuration
├── Dockerfile                 # Production multi-stage Docker build
├── docker-compose.yml         # Container orchestration config
└── package.json               # Package declarations & script configurations
```

---

## ⚡ Script Commands

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Runs the API in hot-reload mode using `tsx watch` |
| `build` | `npm run build` | Compiles TypeScript codebase to JavaScript in `dist/` |
| `start` | `npm run start` | Runs the compiled JavaScript from the `dist/` directory |
| `test` | `npm test` | Runs the Jest integration test suite |
| `lint` | `npm run lint` | Inspects codebase for static analysis violations |
| `lint:fix` | `npm run lint:fix` | Automatically corrects fixable linting violations |
| `format` | `npm run format` | Standardizes format on all TypeScript files via Prettier |
| `format:check` | `npm run format:check` | Verifies formatting complies with style guidelines |

---

## 🚀 Running the Application Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example`).
   ```bash
   cp .env.example .env
   ```
3. **Run in Development Mode**:
   ```bash
   npm run dev
   ```
   The API will start at: `http://localhost:3000/api/v1/hello`

---

## 🧪 Testing and Verification

- **Linting check**:
  ```bash
  npm run lint
  ```
- **Formatting check**:
  ```bash
  npm run format:check
  ```
- **Run test suite**:
  ```bash
  npm test
  ```

---

## 🐳 Running with Docker

This repository supports a multi-stage Docker setup for optimized, lightweight production builds.

1. **Build and Run using Docker Compose**:
   ```bash
   docker-compose up --build -d
   ```
2. **Accessing the Containerized Service**:
   The API will be mapped to `http://localhost:3000/api/v1/hello`

3. **Tear Down the Container**:
   ```bash
   docker-compose down
   ```
