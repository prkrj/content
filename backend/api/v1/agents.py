"""
Professor Framework agent API endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from datetime import datetime
from database.session import get_db
from core.security import get_current_active_user, get_author
from models.user import User
from models.agent import (
    AgentJob,
    AgentJobCreate,
    AgentJobUpdate,
    AgentJobInDB,
    AgentInfo,
    AgentJobResult,
    AgentJobStatus,
)

router = APIRouter(prefix="/agents")


# Agent catalog - information about available Professor Framework agents
AVAILABLE_AGENTS = [
    {
        "id": "curriculum-architect",
        "name": "Curriculum Architect",
        "description": "Design complete curriculum structures with scope, sequence, and standards alignment",
        "category": "curriculum-design",
        "estimated_time": "2-4 hours",
        "productivity_gain": "10x",
        "capabilities": [
            "Scope and sequence development",
            "Learning objectives writing (Bloom's Taxonomy)",
            "Standards alignment (TEKS, CCSS, NGSS)",
            "Assessment blueprint creation",
            "UDL principles integration"
        ],
        "required_role": "author"
    },
    {
        "id": "content-developer",
        "name": "Content Developer",
        "description": "Create high-quality lessons, assessments, and learning activities",
        "category": "content-creation",
        "estimated_time": "1-2 hours",
        "productivity_gain": "5-7x",
        "capabilities": [
            "Lesson plan creation with instructional routines",
            "Assessment item development",
            "Activity and practice worksheet generation",
            "Scaffolding for emergent bilinguals",
            "Multimedia content scripts"
        ],
        "required_role": "author"
    },
    {
        "id": "assessment-designer",
        "name": "Assessment Designer",
        "description": "Design comprehensive assessments with rubrics and answer keys",
        "category": "assessment",
        "estimated_time": "1-3 hours",
        "productivity_gain": "8x",
        "capabilities": [
            "Assessment blueprint design",
            "Item writing (MC, CR, performance tasks)",
            "Rubric development with detailed criteria",
            "Answer key and scoring guide creation",
            "Assessment validation and bias review"
        ],
        "required_role": "author"
    },
    {
        "id": "pedagogical-reviewer",
        "name": "Pedagogical Reviewer",
        "description": "Review content for pedagogical soundness and alignment",
        "category": "quality-assurance",
        "estimated_time": "30-60 minutes",
        "productivity_gain": "4x",
        "capabilities": [
            "Constructive alignment validation",
            "Learning science principles check",
            "Instructional strategy evaluation",
            "Cognitive load analysis",
            "Differentiation recommendations"
        ],
        "required_role": "editor"
    },
    {
        "id": "accessibility-validator",
        "name": "Accessibility Validator",
        "description": "Validate WCAG 2.1 AA compliance and UDL implementation",
        "category": "quality-assurance",
        "estimated_time": "20-40 minutes",
        "productivity_gain": "6x",
        "capabilities": [
            "WCAG 2.1 Level AA validation",
            "Screen reader compatibility check",
            "UDL principles review",
            "Alt text and caption verification",
            "Keyboard navigation validation"
        ],
        "required_role": "editor"
    },
    {
        "id": "standards-compliance",
        "name": "Standards Compliance Checker",
        "description": "Validate alignment to educational standards and state requirements",
        "category": "quality-assurance",
        "estimated_time": "15-30 minutes",
        "productivity_gain": "5x",
        "capabilities": [
            "Standards alignment verification (TEKS, CCSS, NGSS)",
            "State compliance check (SBOE, adoption criteria)",
            "EL support validation (ELPS, ELD, ESOL)",
            "Graduation requirements check",
            "Cross-reference validation"
        ],
        "required_role": "editor"
    },
    {
        "id": "adaptive-learning",
        "name": "Adaptive Learning Designer",
        "description": "Create adaptive learning paths and personalized content",
        "category": "personalization",
        "estimated_time": "2-3 hours",
        "productivity_gain": "7x",
        "capabilities": [
            "Diagnostic assessment creation",
            "Learning path design",
            "Personalized recommendations",
            "Mastery-based progression",
            "Data-driven interventions"
        ],
        "required_role": "author"
    },
    {
        "id": "instructional-designer",
        "name": "Instructional Designer",
        "description": "Apply instructional design frameworks (ADDIE, SAM, Backwards Design)",
        "category": "curriculum-design",
        "estimated_time": "3-5 hours",
        "productivity_gain": "6x",
        "capabilities": [
            "Needs analysis",
            "Learning objectives development",
            "Instructional strategy selection",
            "Media and modality recommendations",
            "Evaluation plan design"
        ],
        "required_role": "author"
    },
    {
        "id": "quality-assurance",
        "name": "Quality Assurance",
        "description": "Comprehensive quality review across all quality pillars",
        "category": "quality-assurance",
        "estimated_time": "1-2 hours",
        "productivity_gain": "5x",
        "capabilities": [
            "Multi-dimensional quality review",
            "Standards alignment validation",
            "Pedagogical soundness check",
            "Accessibility compliance",
            "Bias detection and elimination",
            "Quality scoring and recommendations"
        ],
        "required_role": "editor"
    },
    {
        "id": "scorm-validator",
        "name": "SCORM Validator",
        "description": "Validate SCORM 1.2 and 2004 package compliance",
        "category": "packaging",
        "estimated_time": "15-30 minutes",
        "productivity_gain": "8x",
        "capabilities": [
            "SCORM 1.2/2004 validation",
            "Manifest file verification",
            "LMS compatibility testing",
            "Sequencing and navigation check",
            "Runtime communication validation"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "learning-analytics",
        "name": "Learning Analytics",
        "description": "Analyze learning outcomes and generate actionable insights",
        "category": "analytics",
        "estimated_time": "1-2 hours",
        "productivity_gain": "7x",
        "capabilities": [
            "Objective mastery rate calculation",
            "Performance distribution analysis",
            "Achievement gap identification",
            "Learning trajectory prediction",
            "Intervention recommendations"
        ],
        "required_role": "editor"
    },
    {
        "id": "project-planning",
        "name": "Project Planning",
        "description": "Plan educational content development projects with timelines",
        "category": "project-management",
        "estimated_time": "2-3 hours",
        "productivity_gain": "6x",
        "capabilities": [
            "Project scope definition",
            "Resource allocation planning",
            "Timeline and milestone creation",
            "Risk assessment and mitigation",
            "Dependency mapping"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "review-workflow",
        "name": "Review Workflow Manager",
        "description": "Orchestrate multi-stage review and approval processes",
        "category": "workflow",
        "estimated_time": "30-60 minutes",
        "productivity_gain": "5x",
        "capabilities": [
            "Review assignment automation",
            "Workflow state management",
            "Reviewer feedback aggregation",
            "Approval routing",
            "Version control integration"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "content-library",
        "name": "Content Library Manager",
        "description": "Organize and manage reusable content assets",
        "category": "content-management",
        "estimated_time": "1-2 hours",
        "productivity_gain": "4x",
        "capabilities": [
            "Asset cataloging and tagging",
            "Content reuse recommendations",
            "Version history tracking",
            "Search and discovery optimization",
            "Metadata management"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "rights-management",
        "name": "Rights & Licensing Manager",
        "description": "Manage content rights, licensing, and attribution",
        "category": "compliance",
        "estimated_time": "30-45 minutes",
        "productivity_gain": "6x",
        "capabilities": [
            "License compatibility checking",
            "Attribution requirements tracking",
            "Copyright compliance validation",
            "Third-party content clearance",
            "Usage rights documentation"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "performance-optimization",
        "name": "Performance Optimizer",
        "description": "Optimize content delivery and loading performance",
        "category": "technical",
        "estimated_time": "1-2 hours",
        "productivity_gain": "7x",
        "capabilities": [
            "Asset compression and optimization",
            "Loading performance analysis",
            "Caching strategy recommendations",
            "CDN configuration",
            "Mobile performance optimization"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "platform-training",
        "name": "Platform Training Designer",
        "description": "Create training materials for platform users",
        "category": "training",
        "estimated_time": "2-4 hours",
        "productivity_gain": "5x",
        "capabilities": [
            "User role-based training paths",
            "Interactive tutorial creation",
            "Video script development",
            "Quick reference guide generation",
            "FAQ and troubleshooting content"
        ],
        "required_role": "author"
    },
    {
        "id": "ab-testing",
        "name": "A/B Testing Designer",
        "description": "Design and analyze A/B tests for content effectiveness",
        "category": "analytics",
        "estimated_time": "1-3 hours",
        "productivity_gain": "6x",
        "capabilities": [
            "Test hypothesis formulation",
            "Variant design and creation",
            "Sample size calculation",
            "Statistical significance analysis",
            "Recommendation generation"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "market-intelligence",
        "name": "Market Intelligence Analyst",
        "description": "Analyze educational market trends and competitor content",
        "category": "strategy",
        "estimated_time": "2-4 hours",
        "productivity_gain": "8x",
        "capabilities": [
            "Competitor content analysis",
            "Market trend identification",
            "Gap analysis and opportunities",
            "Pricing strategy recommendations",
            "Adoption barrier identification"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "sales-enablement",
        "name": "Sales Enablement",
        "description": "Generate sales collateral and customer-facing materials",
        "category": "business",
        "estimated_time": "1-2 hours",
        "productivity_gain": "7x",
        "capabilities": [
            "Product sheet generation",
            "ROI calculator creation",
            "Demo script development",
            "Customer success stories",
            "Competitive comparison charts"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "localization",
        "name": "Localization Manager",
        "description": "Translate and culturally adapt content for global markets",
        "category": "internationalization",
        "estimated_time": "3-6 hours",
        "productivity_gain": "6x",
        "capabilities": [
            "Translation coordination",
            "Cultural adaptation recommendations",
            "Locale-specific formatting",
            "Right-to-left language support",
            "Internationalization QA"
        ],
        "required_role": "knowledge_engineer"
    },
    {
        "id": "corporate-training",
        "name": "Corporate Training Developer",
        "description": "Create professional learning and corporate training content",
        "category": "professional-learning",
        "estimated_time": "2-4 hours",
        "productivity_gain": "7x",
        "capabilities": [
            "Workplace competency mapping",
            "Compliance training development",
            "Onboarding program creation",
            "Skills gap analysis",
            "Microlearning module design"
        ],
        "required_role": "author"
    },
]


@router.get("/", response_model=List[AgentInfo])
async def list_available_agents(
    current_user: User = Depends(get_current_active_user),
):
    """
    List all available Professor Framework agents.

    Returns agent metadata including capabilities, estimated time,
    and productivity gains. Filters agents based on user role.
    """
    # Filter agents based on user role permissions
    user_role_hierarchy = {
        "teacher": 0,
        "author": 1,
        "editor": 2,
        "knowledge_engineer": 3
    }

    user_level = user_role_hierarchy.get(current_user.role, 0)

    available = []
    for agent in AVAILABLE_AGENTS:
        required_level = user_role_hierarchy.get(agent["required_role"], 0)
        if user_level >= required_level:
            available.append(AgentInfo(**agent))

    return available


@router.post("/invoke", response_model=AgentJobInDB, status_code=status.HTTP_201_CREATED)
async def invoke_agent(
    job: AgentJobCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_author),
    db: Session = Depends(get_db),
):
    """
    Invoke a Professor Framework agent to perform a task.

    Creates an agent job and starts execution in the background.
    Returns job ID for status polling.

    Required role: author or above
    """
    # Validate agent type exists
    agent_ids = [a["id"] for a in AVAILABLE_AGENTS]
    if job.agent_type not in agent_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid agent type. Available agents: {', '.join(agent_ids)}"
        )

    # Check user has permission for this agent
    agent_info = next((a for a in AVAILABLE_AGENTS if a["id"] == job.agent_type), None)
    role_hierarchy = {"teacher": 0, "author": 1, "editor": 2, "knowledge_engineer": 3}

    if role_hierarchy.get(current_user.role, 0) < role_hierarchy.get(agent_info["required_role"], 1):
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient permissions. Required role: {agent_info['required_role']}"
        )

    # Create agent job record
    db_job = AgentJob(
        agent_type=job.agent_type,
        user_id=current_user.id,
        task_description=job.task_description,
        parameters=job.parameters,
        status=AgentJobStatus.QUEUED,
        progress_percentage=0
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # Start agent execution in background using sync wrapper
    # This ensures the async agent execution runs properly
    background_tasks.add_task(run_agent_job_sync, db_job.id)

    return db_job


@router.get("/jobs", response_model=List[AgentJobInDB])
async def list_user_jobs(
    status: Optional[AgentJobStatus] = None,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List agent jobs for current user.

    Optionally filter by status (queued, running, completed, failed, cancelled).
    """
    query = db.query(AgentJob).filter(AgentJob.user_id == current_user.id)

    if status:
        query = query.filter(AgentJob.status == status)

    jobs = query.order_by(AgentJob.created_at.desc()).limit(limit).all()
    return jobs


@router.get("/jobs/{job_id}", response_model=AgentJobInDB)
async def get_job_status(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get status and progress of an agent job.

    Use this endpoint to poll for job completion.
    """
    job = db.query(AgentJob).filter(AgentJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check ownership (except for editors/engineers who can view all)
    if job.user_id != current_user.id and current_user.role not in ["editor", "knowledge_engineer"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return job


@router.get("/jobs/{job_id}/result", response_model=AgentJobResult)
async def get_job_result(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get complete result of a completed agent job.

    Returns generated content, metadata, and suggested next steps.
    """
    job = db.query(AgentJob).filter(AgentJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check ownership
    if job.user_id != current_user.id and current_user.role not in ["editor", "knowledge_engineer"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if job.status != AgentJobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed yet. Current status: {job.status}"
        )

    # Generate suggested next steps based on agent type
    suggestions = generate_next_steps(job.agent_type, job.output_metadata or {})

    return AgentJobResult(
        job=job,
        generated_content=job.output_content,
        metadata=job.output_metadata,
        suggestions=suggestions
    )


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Cancel a running or queued agent job."""
    job = db.query(AgentJob).filter(AgentJob.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check ownership
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if job.status not in [AgentJobStatus.QUEUED, AgentJobStatus.RUNNING]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel job in {job.status} status"
        )

    job.status = AgentJobStatus.CANCELLED
    job.completed_at = datetime.utcnow()
    db.commit()

    return {"message": "Job cancelled successfully"}


# Background task execution
def run_agent_job_sync(job_id: int):
    """
    Synchronous wrapper to run async agent job in background.
    This ensures the async function runs properly in FastAPI's background tasks.
    """
    import asyncio
    import logging

    logger = logging.getLogger(__name__)
    logger.info(f"[Job {job_id}] Background task started (sync wrapper)")

    try:
        # Create new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Run the async function
        loop.run_until_complete(execute_agent_job(job_id))

        # Close the loop
        loop.close()
        logger.info(f"[Job {job_id}] Background task completed successfully")
    except Exception as e:
        logger.error(f"[Job {job_id}] Background task failed: {str(e)}", exc_info=True)


async def execute_agent_job(job_id: int):
    """
    Execute agent job in background using real Claude API.

    This function:
    1. Invokes the AgentExecutor with Claude API
    2. Streams progress updates to the database
    3. Stores generated content and metadata
    4. Handles errors and timeouts
    """
    from database.session import SessionLocal
    import logging

    logger = logging.getLogger(__name__)
    db = SessionLocal()
    job = None

    try:
        # Import executor inside try block to catch import errors
        from services.agent_executor import get_agent_executor

        job = db.query(AgentJob).filter(AgentJob.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found")
            return

        # Update status to running
        job.status = AgentJobStatus.RUNNING
        job.started_at = datetime.utcnow()
        job.progress_percentage = 10
        job.progress_message = "Initializing agent..."
        db.commit()
        logger.info(f"[Job {job_id}] Starting execution - Agent: {job.agent_type}")
        logger.info(f"[Job {job_id}] Task: {job.task_description[:100]}...")

        # Get agent executor
        agent_executor = get_agent_executor()
        logger.info(f"[Job {job_id}] Agent executor initialized")

        job.progress_percentage = 30
        job.progress_message = "Connecting to Claude AI..."
        db.commit()
        logger.info(f"[Job {job_id}] Connecting to Claude API (model: claude-3-sonnet-20240229)")

        # Execute agent with real Claude API
        logger.info(f"[Job {job_id}] Sending request to Claude API...")
        result = await agent_executor.execute_agent(
            agent_type=job.agent_type,
            task=job.task_description,
            parameters=job.parameters,
            use_knowledge_base=True,
        )
        logger.info(f"[Job {job_id}] Received response from Claude API")

        job.progress_percentage = 80
        job.progress_message = "Processing results..."
        db.commit()
        logger.info(f"[Job {job_id}] Processing and storing results...")

        # Check if execution was successful
        if result["metadata"]["success"]:
            job.status = AgentJobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            job.progress_percentage = 100
            job.progress_message = "Complete"
            job.output_content = result["output"]
            job.output_metadata = result["metadata"]
            output_length = len(result["output"]) if result["output"] else 0
            logger.info(f"[Job {job_id}] ✓ SUCCESS - Generated {output_length} characters of content")
        else:
            # Execution failed
            job.status = AgentJobStatus.FAILED
            job.completed_at = datetime.utcnow()
            error_msg = result["metadata"].get("error", "Unknown error")
            job.error_message = error_msg
            logger.error(f"[Job {job_id}] ✗ FAILED - {error_msg}")

        db.commit()
        logger.info(f"[Job {job_id}] Job status saved to database")

    except Exception as e:
        logger.error(f"Error executing agent job {job_id}: {str(e)}", exc_info=True)
        if job:
            job.status = AgentJobStatus.FAILED
            job.completed_at = datetime.utcnow()
            job.error_message = f"{type(e).__name__}: {str(e)}"
            job.progress_percentage = 0
            job.progress_message = "Execution failed"
            db.commit()
    finally:
        db.close()


def generate_mock_content(agent_type: str, task: str, parameters: dict) -> dict:
    """Generate mock content for demonstration purposes."""

    if agent_type == "curriculum-architect":
        return {
            "content": f"""# Curriculum Design: {task}

## Scope and Sequence

### Unit 1: Introduction
- Learning Objectives:
  1. Students will understand core concepts
  2. Students will apply knowledge in context
  3. Students will analyze relationships

### Unit 2: Deep Dive
- Learning Objectives:
  1. Students will synthesize information
  2. Students will evaluate solutions
  3. Students will create original work

## Assessment Blueprint
- Formative assessments every 2 lessons
- Unit assessments after each unit
- Performance task at end of course

## Standards Alignment
{', '.join(parameters.get('standards', ['TEKS.5.3.K']))}
""",
            "metadata": {
                "units_created": 2,
                "learning_objectives": 6,
                "standards_aligned": parameters.get('standards', ['TEKS.5.3.K']),
                "estimated_duration": "45 hours",
                "grade_levels": parameters.get('grade_levels', ['5'])
            }
        }

    elif agent_type == "content-developer":
        return {
            "content": f"""# Lesson: {task}

## Learning Objectives
Students will be able to:
1. Explain key concepts with 80% accuracy
2. Apply knowledge to solve problems
3. Collaborate effectively in groups

## Materials
- Student worksheets
- Manipulatives
- Digital resources

## Lesson Flow (45 minutes)

### Warm-up (5 min)
Activate prior knowledge with quick review

### Direct Instruction (15 min)
- Model the concept
- Think-aloud demonstration
- Check for understanding

### Guided Practice (15 min)
- Work through examples together
- Use MLR2 (Collect and Display) for math discourse
- Provide scaffolding for ELs

### Independent Practice (10 min)
- Apply concepts independently
- Exit ticket assessment
""",
            "metadata": {
                "lesson_type": "direct_instruction",
                "duration": "45 minutes",
                "grade_level": parameters.get('grade_levels', ['5'])[0],
                "subject": parameters.get('subject', 'mathematics'),
                "instructional_routines": ["MLR2"]
            }
        }

    else:
        return {
            "content": f"# {agent_type.replace('-', ' ').title()}\n\n{task}\n\nGenerated content would appear here.",
            "metadata": {"agent_type": agent_type}
        }


def generate_next_steps(agent_type: str, metadata: dict) -> List[str]:
    """Generate suggested next steps based on agent output."""

    if agent_type == "curriculum-architect":
        return [
            "Create lesson plans for Unit 1",
            "Design assessments for each unit",
            "Generate practice activities",
            "Review with pedagogical expert"
        ]
    elif agent_type == "content-developer":
        return [
            "Create assessment for this lesson",
            "Generate student worksheet",
            "Add multimedia elements",
            "Review for accessibility"
        ]
    elif agent_type == "assessment-designer":
        return [
            "Review items with content expert",
            "Validate with bias checker",
            "Create answer key",
            "Test with pilot group"
        ]
    else:
        return [
            "Review generated content",
            "Make any necessary edits",
            "Submit for editorial review"
        ]
