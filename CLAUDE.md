# 🤖 Claude AI Agent Configuration

This file configures Claude AI agents for the `cukain-aja` project. These agents are used to automate development tasks, code generation, and project management.

## 📋 Table of Contents

- [Agent Configuration](#agent-configuration)
- [Available Agents](#available-agents)
- [Agent Descriptions](#agent-descriptions)
- [Usage](#usage)
- [Customization](#customization)

## 🤖 Agent Configuration

| Agent Name | Description | Purpose |
|------------|-------------|---------|
| **Product Manager** | Product Manager | Defines product vision, roadmap, and feature requirements |
| **Project Manager** | Project Manager | Manages project timeline, tasks, and resources |
| **UX/UI Designer** | UX/UI Designer | Creates wireframes, mockups, and user interfaces |
| **Frontend Developer** | Frontend Developer | Builds user-facing interfaces with React/Next.js |
| **Backend Developer** | Backend Developer | Develops server-side logic and APIs |
| **DevOps Engineer** | DevOps Engineer | Manages infrastructure, CI/CD, and deployment |
| **QA Engineer** | QA Engineer | Tests code, identifies bugs, and ensures quality |
| **Technical Writer** | Technical Writer | Creates documentation and user guides |

## 📋 Available Agents

### 1. Product Manager

**Purpose:** Defines product vision, roadmap, and feature requirements

**Key Responsibilities:**
- Market research and competitive analysis
- Feature prioritization and roadmap planning
- User story creation and backlog management
- Product strategy and positioning

**Usage Example:**
```bash
claude agent ProductManager "Define product vision for Cukain Aja"
```

### 2. Project Manager

**Purpose:** Manages project timeline, tasks, and resources

**Key Responsibilities:**
- Project planning and scheduling
- Task breakdown and assignment
- Progress tracking and reporting
- Risk management and mitigation

**Usage Example:**
```bash
claude agent ProjectManager "Create project plan for Q2 2024"
```

### 3. UX/UI Designer

**Purpose:** Creates wireframes, mockups, and user interfaces

**Key Responsibilities:**
- User research and persona development
- Wireframing and prototyping
- UI design and styling
- Usability testing and optimization

**Usage Example:**
```bash
claude agent UXDesigner "Design login page with modern UI"
```

### 4. Frontend Developer

**Purpose:** Builds user-facing interfaces with React/Next.js

**Key Responsibilities:**
- Component development
- State management implementation
- API integration
- Performance optimization

**Usage Example:**
```bash
claude agent FrontendDeveloper "Create product listing page"
```

### 5. Backend Developer

**Purpose:** Develops server-side logic and APIs

**Key Responsibilities:**
- API development
- Database design and management
- Authentication and authorization
- Business logic implementation

**Usage Example:**
```bash
claude agent BackendDeveloper "Implement payment gateway integration"
```

### 6. DevOps Engineer

**Purpose:** Manages infrastructure, CI/CD, and deployment

**Key Responsibilities:**
- Infrastructure setup and management
- CI/CD pipeline configuration
- Deployment automation
- Monitoring and logging

**Usage Example:**
```bash
claude agent DevOpsEngineer "Set up CI/CD pipeline for Next.js app"
```

### 7. QA Engineer

**Purpose:** Tests code, identifies bugs, and ensures quality

**Key Responsibilities:**
- Test case development
- Automated testing
- Bug reporting and tracking
- Performance testing

**Usage Example:**
```bash
claude agent QAEngineer "Create test cases for checkout flow"
```

### 8. Technical Writer

**Purpose:** Creates documentation and user guides

**Key Responsibilities:**
- API documentation
- User guides and tutorials
- Technical specifications
- Release notes

**Usage Example:**
```bash
claude agent TechnicalWriter "Write API documentation for payment module"
```

## 🚀 Usage

### Basic Usage

To use an agent, simply run the following command:

```bash
claude agent <agent_name> "<task_description>"
```

### Example Workflow

```bash
# 1. Define product vision
claude agent ProductManager "Define product vision for Cukain Aja"

# 2. Create project plan
claude agent ProjectManager "Create project plan for Q2 2024"

# 3. Design user interface
claude agent UXDesigner "Design product detail page"

# 4. Implement frontend
claude agent FrontendDeveloper "Build product detail page component"

# 5. Implement backend
claude agent BackendDeveloper "Create API for product details"

# 6. Test the feature
claude agent QAEngineer "Test product detail page"

# 7. Document the feature
claude agent TechnicalWriter "Document product detail page API"
```

## 🛠️ Customization

### Adding New Agents

To add a new agent, create a new file in the `.claude/agents/` directory with the following structure:

```yaml
name: AgentName
description: Agent description
model: claude-3-5-sonnet-20240620
instructions: |
  You are a [role] responsible for [responsibilities].
  Follow these guidelines:
  - [guideline 1]
  - [guideline 2]
  - [guideline 3]

context: |
  Project: Cukain Aja
  Frameworks: Next.js, React, Tailwind CSS
  Database: PostgreSQL
  Deployment: Vercel

permissions:
  - read: src/**
  - write: src/**
  - read: .claude/**
```

### Modifying Existing Agents

To modify an existing agent, edit the corresponding YAML file in `.claude/agents/`:

```yaml
name: AgentName
description: Updated description
model: claude-3-5-sonnet-20240620
instructions: |
  You are now a [updated role] responsible for [updated responsibilities].
  Follow these guidelines:
  - [updated guideline 1]
  - [updated guideline 2]
  - [updated guideline 3]

context: |
  Project: Cukain Aja
  Frameworks: Next.js, React, Tailwind CSS
  Database: PostgreSQL
  Deployment: Vercel

permissions:
  - read: src/**
  - write: src/**
  - read: .claude/**
```

### Agent Configuration Options

| Option | Description | Example |
|--------|-------------|---------|
| `name` | Agent name | `ProductManager` |
| `description` | Agent description | `Product Manager` |
| `model` | Claude model to use | `claude-3-5-sonnet-20240620` |
| `instructions` | Agent instructions | YAML instructions |
| `context` | Project context | Project details |
| `permissions` | File permissions | `read: src/**`, `write: src/**` |

## 📚 Best Practices

### For Developers

1. **Be Specific** - Provide clear and detailed task descriptions
2. **Provide Context** - Include relevant project information
3. **Iterate** - Break down complex tasks into smaller steps
4. **Review Code** - Always review agent-generated code
5. **Test Thoroughly** - Ensure code quality and functionality

### For Project Managers

1. **Define Clear Goals** - Set specific objectives for each agent
2. **Assign Appropriate Agents** - Match tasks to the right expertise
3. **Monitor Progress** - Track agent performance and output
4. **Provide Feedback** - Help agents improve over time
5. **Integrate Workflows** - Combine multiple agents for complex tasks

## 📊 Agent Performance

| Agent | Average Response Time | Success Rate | Common Issues |
|-------|-----------------------|--------------|---------------|
| Product Manager |
