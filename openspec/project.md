# Sistem Hunian - Integrated Project Documentation

## Project Overview

**Sistem Hunian** is a full-stack residential management system built as two integrated applications:
- **Frontend (Sistem-Hunian-V2)**: React + TypeScript web application
- **Backend (Sistem-Hunian-Go)**: Go REST API with Fiber framework

**Purpose**: Comprehensive residential property management system handling user management, document workflows, property listings, and administrative operations.

**Architecture**: Feature-based modular architecture with clear separation between frontend presentation and backend business logic.

---

## Repository Structure

### Frontend Repository: `Sistem-Hunian-V2`
**Location**: `F:\Coding\React\Sistem-Hunian-V2`
**Type**: React + TypeScript SPA
**Build Tool**: Vite

### Backend Repository: `Sistem-Hunian-Go`
**Location**: `F:\Coding\golang\Sistem-Hunian-Go`
**Type**: Go REST API
**Module**: `github.com/itsramaa/sihuni-api`
**Go Version**: 1.25.0

---

## Tech Stack

### Frontend (Sistem-Hunian-V2)

#### Core Framework
- **React**: 18.3.1 (Latest stable)
- **TypeScript**: 5.8.3
- **Vite**: 5.4.19 (Build tool, dev server)
- **React Router**: 6.30.1 (Client-side routing)

#### UI Framework & Components
- **Radix UI**: Comprehensive primitive component library
  - Dialog, Dropdown, Select, Tabs, Toast, Tooltip, etc.
  - 20+ Radix primitives for accessible UI
- **Tailwind CSS**: 3.4.17 (Utility-first CSS)
- **Lucide React**: 0.462.0 (Icon library)
- **shadcn/ui pattern**: Component architecture based on Radix + Tailwind

#### State Management
- **Zustand**: 5.0.11 (Global state management)
- **Tanstack Query (React Query)**: 5.83.0 (Server state, caching, data fetching)

#### Form Handling & Validation
- **React Hook Form**: 7.61.1 (Form state management)
- **Zod**: 3.25.76 (TypeScript-first schema validation)
- **@hookform/resolvers**: 3.10.0 (Zod integration)

#### Data Visualization & Mapping
- **Recharts**: 2.15.4 (Charts and graphs)
- **Leaflet**: 1.9.4 (Interactive maps)
- **React Leaflet**: 4.2.1 (React wrapper for Leaflet)

#### Utilities
- **Axios**: 1.7.9 (HTTP client)
- **date-fns**: 3.6.0 (Date manipulation)
- **DOMPurify**: 3.3.1 (XSS sanitization)
- **class-variance-authority**: 0.7.1 (CVA for component variants)
- **clsx** + **tailwind-merge**: Class name utilities

#### Development Tools
- **ESLint**: 9.32.0 (Linting)
- **TypeScript ESLint**: 8.38.0
- **Vite Plugin React SWC**: 3.11.0 (Fast refresh with SWC)
- **Autoprefixer**: 10.4.21 (CSS vendor prefixes)

### Backend (Sistem-Hunian-Go)

#### Core Framework
- **Go**: 1.25.0
- **Fiber**: v2.52.13 (Express-inspired web framework)
- **Module**: github.com/itsramaa/sihuni-api

#### Database & ORM
- **PostgreSQL**: Primary database (via pgx)
- **pgx/v5**: 5.7.4 (PostgreSQL driver and toolkit)

#### Authentication & Security
- **JWT**: golang-jwt/jwt/v5 5.2.2 (JSON Web Tokens)
- **bcrypt**: golang.org/x/crypto 0.52.0 (Password hashing)

#### File Storage
- **MinIO**: v7.0.80 (S3-compatible object storage)

#### Validation & Utilities
- **Validator**: go-playground/validator/v10 10.30.3 (Struct validation)
- **UUID**: google/uuid 1.6.0 (Unique identifiers)
- **godotenv**: joho/godotenv 1.5.1 (Environment variables)

#### Testing
- **Testify**: stretchr/testify 1.11.1 (Test assertions and mocks)

---

## Frontend Architecture (Sistem-Hunian-V2)

### Directory Structure
```
Sistem-Hunian-V2/
├── public/                         # Static files served directly
├── src/
│   ├── app/                        # Application-level configuration
│   │   ├── pages/                  # Global application non-feature pages (404, Unauthorized, etc.)
│   │   ├── layouts/                # Shared page layouts
│   │   ├── providers/              # Global React providers
│   │   └── router/                 # Route definitions
│   │
│   ├── assets/                     # Bundled static assets
│   │   ├── fonts/                  # Custom fonts
│   │   ├── icons/                  # SVG/icons
│   │   ├── images/                 # Imported images
│   │   └── styles/                 # Global styles/themes
│   │
│   ├── shared/                     # Reusable across multiple features
│   │   ├── components/             # Shared UI components
│   │   ├── hooks/                  # Shared custom hooks
│   │   ├── types/                  # Shared TypeScript types
│   │   ├── utils/                  # Shared helper functions
│   │   └── lib/                    # Shared third-party setup
│   │
│   ├── features/                   # Business/domain modules
│   │   ├── feature-name/
│   │   │   ├── api/                # API/external communication
│   │   │   ├── components/         # Feature UI components
│   │   │   ├── pages/              # Route pages
│   │   │   ├── hooks/              # Feature business logic
│   │   │   ├── constants/          # Feature constants
│   │   │   ├── utils/              # Feature helper functions
│   │   │   └── types/              # Feature-specific types
│   │   │
│   │   └── ...
│   │
│   ├── store/                      # Global Zustand stores
│   ├── config/                     # Environment/app configuration
│   ├── main.tsx                    # Application entry point
│   └── vite-env.d.ts               # Vite TypeScript declarations
├── .cursor/                   # Cursor IDE configuration
├── openspec/                  # OpenSpec documentation
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

### Key Architectural Patterns

#### Feature-Based Organization
- **Core principle**: Group by feature, not by file type
- Each feature module contains its own components, hooks, services, types
- Example: `features/auth/` contains login components, auth hooks, auth API calls

#### Component Hierarchy
1. **Primitive (ui/)**: Low-level, reusable UI primitives (Button, Input, Dialog)
2. **Composite (shared/)**: Business-agnostic composed components (Header, Sidebar)
3. **Feature components**: Business-specific components within feature modules
4. **Page components**: Thin orchestration layer, composes features

#### State Management Strategy
- **Zustand**: Global app state (user session, auth status, app preferences)
- **Tanstack Query**: Server state (API data, caching, background refetch)
- **React Hook Form**: Local form state
- **Context**: Theme, auth provider for deep component trees

#### Code Splitting & Performance
Vite configuration includes manual chunk splitting:
- **vendor**: Core React libraries
- **ui**: All Radix UI components
- **data**: State management libraries (Query, Zustand)
- **charts**: Recharts
- **maps**: Leaflet libraries

---

## Backend Architecture (Sistem-Hunian-Go)

### Expected Directory Structure
```
Sistem-Hunian-Go/
├── cmd/                       # Application entrypoints
├── internal/                  # Private application code
│   ├── handler/               # HTTP handlers (controllers)
│   ├── service/               # Business logic layer
│   ├── repository/            # Data access layer
│   ├── model/                 # Domain models and entities
│   ├── middleware/            # HTTP middleware (auth, logging, CORS)
│   ├── dto/                   # Data Transfer Objects
│   └── validator/             # Custom validation logic
├── pkg/                       # Public reusable packages
├── config/                    # Configuration files
├── migrations/                # Database migrations
├── docs/                      # API documentation
├── go.mod
└── go.sum
```

### Architectural Patterns

#### Layered Architecture
1. **Handler Layer**: HTTP request/response handling
2. **Service Layer**: Business logic, orchestration
3. **Repository Layer**: Database operations
4. **Model Layer**: Domain entities

#### Dependency Injection
- Services injected into handlers
- Repositories injected into services
- Database connection passed to repositories

#### Middleware Stack
- JWT authentication middleware
- Request logging
- Error handling
- CORS configuration
- Rate limiting (if implemented)

---

## API Integration

### API Communication
- **Protocol**: REST over HTTP/HTTPS
- **Data Format**: JSON
- **Authentication**: JWT Bearer tokens
- **Base URL**: Configured via environment variables

### Frontend API Client (Axios)
Location: `src/services/api/`
- Axios instance with base URL configuration
- Request interceptors: Add JWT token to headers
- Response interceptors: Handle 401 (refresh token), global error handling
- API service modules per feature (authAPI, userAPI, documentAPI)

### Backend API Endpoints
Expected pattern: `/api/v1/{resource}`
- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/users/*` - User management
- `/api/v1/documents/*` - Document workflows
- `/api/v1/properties/*` - Property listings

---

## Development Setup

### Frontend Development

#### Prerequisites
- Node.js 18+ (recommended)
- npm or yarn

#### Installation
```bash
cd F:\Coding\React\Sistem-Hunian-V2
npm install
```

#### Development Server
```bash
npm run dev
# Server runs on http://localhost:8080
```

#### Build
```bash
npm run build          # Production build
npm run build:dev      # Development build
```

#### Linting
```bash
npm run lint
```

### Backend Development

#### Prerequisites
- Go 1.25.0+
- PostgreSQL 14+
- MinIO (for file storage)

#### Installation
```bash
cd F:\Coding\golang\Sistem-Hunian-Go
go mod download
```

#### Environment Setup
Create `.env` file with:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/sihuni
JWT_SECRET=your-secret-key
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

#### Run Development Server
```bash
go run cmd/main.go
```

#### Run Tests
```bash
go test ./...
```

---

## Coding Conventions

### Frontend (TypeScript/React)

#### File Naming
- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`UserType.ts` or `user.types.ts`)
- **Constants**: UPPER_SNAKE_CASE or camelCase file (`API_ROUTES.ts`)

#### Component Patterns
```typescript
// Functional component with TypeScript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // Hooks at the top
  const { data: user } = useQuery(['user', userId], () => fetchUser(userId));
  const [isEditing, setIsEditing] = useState(false);
  
  // Event handlers
  const handleSave = () => {
    // Implementation
  };
  
  // Render
  return (
    <div className="p-4">
      {/* JSX */}
    </div>
  );
};
```

#### Import Order
1. React and React-related imports
2. Third-party libraries
3. Internal components
4. Internal hooks/services/utils
5. Types
6. Styles/assets

#### State Management
- **Local state**: `useState` for component-specific UI state
- **Form state**: React Hook Form for forms
- **Global state**: Zustand for cross-component app state
- **Server state**: Tanstack Query for API data

### Backend (Go)

#### File Naming
- **Go files**: snake_case (`user_handler.go`, `auth_service.go`)
- **Test files**: `*_test.go` suffix

#### Function Naming
- Exported: PascalCase (`CreateUser`, `GetUserByID`)
- Unexported: camelCase (`validateEmail`, `hashPassword`)

#### Error Handling
```go
func (s *UserService) CreateUser(ctx context.Context, req CreateUserRequest) (*User, error) {
    // Validate input
    if err := s.validator.Validate(req); err != nil {
        return nil, fmt.Errorf("validation failed: %w", err)
    }
    
    // Business logic
    user, err := s.repo.Create(ctx, req)
    if err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }
    
    return user, nil
}
```

#### API Response Pattern
```go
type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}
```

---

## Environment Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Sistem Hunian
VITE_MINIO_ENDPOINT=http://localhost:9000
```

### Backend (.env)
```env
# Server
PORT=3000
ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/sihuni
DB_MAX_CONNECTIONS=25

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=sihuni-uploads
MINIO_USE_SSL=false
```

---

## Git Workflow

### Branch Strategy
- **main/master**: Production-ready code
- **develop**: Integration branch
- **feature/***: New features (`feature/user-profile`)
- **fix/***: Bug fixes (`fix/login-validation`)
- **chore/***: Maintenance tasks (`chore/update-deps`)

### Commit Convention (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Examples**:
```
feat(auth): add JWT refresh token mechanism
fix(user): resolve validation error on empty email
chore(deps): update React to 18.3.1
docs(api): add OpenAPI spec for user endpoints
```

### GitHub Issue Workflow
1. Create Epic issue for major features
2. Create sub-task issues linked to Epic
3. Reference issue numbers in commits: `feat(api): add user endpoint (#42)`
4. Close issues via PR merge

---

## Testing Strategy

### Frontend Testing
- **Unit tests**: Utility functions, custom hooks
- **Component tests**: React Testing Library (when implemented)
- **E2E tests**: Playwright (when implemented)

### Backend Testing
- **Unit tests**: Service layer business logic
- **Integration tests**: Repository layer with test database
- **API tests**: Handler layer with test HTTP server
- **Tool**: Testify for assertions and mocks

---

## Deployment

### Frontend Deployment
**Build output**: `dist/` directory
**Hosting options**: Vercel, Netlify, or static file server (Nginx)

### Backend Deployment
**Binary**: Compiled Go binary
**Hosting options**: VPS, Docker container, cloud platforms (AWS, GCP)

### Docker Support
Expected Docker Compose setup for local development with:
- Frontend container (Nginx serving static files)
- Backend container (Go application)
- PostgreSQL container
- MinIO container

---

## Key Dependencies Reference

### Frontend Major Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | Core framework |
| typescript | 5.8.3 | Type safety |
| vite | 5.4.19 | Build tool |
| @tanstack/react-query | 5.83.0 | Server state |
| zustand | 5.0.11 | Global state |
| react-router-dom | 6.30.1 | Routing |
| axios | 1.7.9 | HTTP client |
| react-hook-form | 7.61.1 | Forms |
| zod | 3.25.76 | Validation |
| tailwindcss | 3.4.17 | Styling |
| lucide-react | 0.462.0 | Icons |

### Backend Major Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| fiber/v2 | 2.52.13 | Web framework |
| pgx/v5 | 5.7.4 | PostgreSQL driver |
| jwt/v5 | 5.2.2 | JWT auth |
| minio-go/v7 | 7.0.80 | Object storage |
| validator/v10 | 10.30.3 | Validation |
| uuid | 1.6.0 | UUID generation |

---

## Documentation Locations

### Frontend Documentation
- **Project structure**: `.cursor/rules/project-structure.mdc`
- **Agent configuration**: `.cursor/AGENTS.mdc`
- **OpenSpec**: `openspec/` (this file and proposals)

### Backend Documentation
- **API docs**: `docs/` directory (expected)
- **Database schema**: `migrations/` directory
- **README**: Root level README.md

---

## Contact & Maintenance

**Project Type**: Residential Management System
**Stack**: React + TypeScript (Frontend) | Go + Fiber (Backend)
**Database**: PostgreSQL
**Storage**: MinIO (S3-compatible)
**Architecture**: Feature-based modular, RESTful API

**Last Updated**: 2026-06-19
