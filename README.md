# Technical Assessment: Senior Full-Stack Developer (FastAPI, React, RAG)

## 1. Objective

Build an AI-powered Knowledge Base Assistant that allows users to upload documents and ask questions about their contents using a Retrieval-Augmented Generation (RAG) pipeline.

The application should retrieve relevant information from uploaded documents and generate answers based on the retrieved context.

The goal is to evaluate your ability to design and implement a maintainable full-stack application with an AI-powered backend.

## 2. Functional Requirements

### 2.1. Document Management

Implement a document management interface that allows users to:

- Upload PDF and TXT documents.
- View a list of uploaded documents.
- See document processing status (pending, processing, completed, failed).
- Delete documents.

The backend should process uploaded documents asynchronously.

### 2.2. RAG Pipeline

Implement a complete RAG pipeline:

1. Extract text from uploaded documents.
2. Split extracted text into meaningful chunks.
3. Generate embeddings for each chunk.
4. Store embeddings and associated metadata in a vector database.
5. Retrieve relevant chunks when a user submits a question.
6. Pass the retrieved context to an LLM.
7. Generate an answer based on the retrieved information.

You can choose the embedding model, vector database, and LLM provider.

The system should preserve document references and page numbers (where applicable) to allow users to identify the source of generated answers.

### 2.3. AI Chat Interface

Implement a chat interface that allows users to:

- Ask questions about uploaded documents.
- Receive AI-generated answers.
- See references to the documents and pages used to generate an answer.
- View previous messages within the current conversation.
- Start a new conversation.

The assistant should handle questions for which the knowledge base does not contain sufficient information. It should not invent answers or present unsupported information as facts.

### 2.4. Backend API

Use FastAPI to implement the backend.

The API should provide endpoints for:

- Document upload and management.
- Document processing status.
- Creating and managing conversations.
- Sending questions and receiving answers.
- Retrieving conversation history.

Use appropriate request/response schemas, validation, and error handling.

## 3. Technical Requirements

### Backend
- Python 3.11+ and FastAPI.
- Use Pydantic for data validation.
- Use PostgreSQL for persistent application data.
- Use a vector database or PostgreSQL with pgvector.
- Implement asynchronous document processing.
- Separate business logic from API endpoints.
- Use environment variables for configuration and API keys.

### Frontend
- React with TypeScript.
- Use a modern component-based architecture.
- Implement document management and chat interfaces.
- Handle loading states, errors, and document processing statuses.
- Provide a clean and intuitive user experience.

### AI / RAG
- Implement document chunking and embedding generation.
- Implement semantic search.
- Include source attribution in generated answers.
- Handle cases where relevant information cannot be retrieved.
- Keep the RAG pipeline modular so that models and embedding providers can be replaced.

## 4. Non-functional Requirements

Pay attention to the following:

- Clean and maintainable code.
- Appropriate separation of responsibilities.
- Error handling and logging.
- Database schema design.
- Efficient document processing.
- Avoiding unnecessary coupling between components.
- Basic security considerations, including file validation and safe handling of API keys.

## 5. Testing

Provide tests covering the most important application functionality.

At a minimum:

- Backend API tests.
- Document processing tests.
- RAG retrieval tests.
- Tests for cases where no relevant context is found.
- Basic frontend tests for important user interactions.

You do not need 100% test coverage. Focus on meaningful tests.

## 6. Deliverables

Provide:

1. Source code in a Git repository.
2. README with setup and execution instructions.
3. Docker Compose configuration to run the application locally.
4. Database schema and migrations.
5. Description of the RAG architecture and key technical decisions.
6. Instructions for configuring the required LLM and embedding providers.
7. Tests and instructions for running them.

## 7. Additional Challenges (Optional)

These features are not mandatory but can demonstrate additional senior-level experience:

- Hybrid search (semantic + keyword search).
- Reranking retrieved chunks.
- Streaming LLM responses.
- Support for multiple document formats.
- Conversation-level context and follow-up questions.
- Document-level access control.
- Retrieval evaluation using a small predefined question/answer dataset.
- Background task retries and recovery from processing failures.
