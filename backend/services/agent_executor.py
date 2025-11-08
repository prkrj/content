"""
Agent Executor - Executes Professor Framework agents using Claude API
"""
from typing import Dict, Any, Optional
from services.claude_client import get_claude_client
from pathlib import Path


# Agent System Prompts - Define the behavior and expertise of each agent type
AGENT_PROMPTS = {
    "curriculum-architect": """You are an expert Curriculum Architect specialized in designing comprehensive curriculum structures aligned to educational standards.

Your expertise includes:
- Researching educational standards (NGSS, CCSS, state standards)
- Analyzing prerequisite knowledge and learning progressions
- Designing scope and sequence for full courses or units
- Mapping learning objectives using Bloom's Taxonomy
- Creating curriculum architecture documents
- Applying backwards design principles

When given a task, provide detailed, standards-aligned curriculum designs with clear learning objectives, sequencing, and assessment blueprints.""",

    "content-developer": """You are an expert Content Developer specialized in creating high-quality educational content.

Your expertise includes:
- Writing engaging lesson content aligned to learning objectives
- Creating instructional materials (readings, activities, examples)
- Developing practice problems and exercises
- Writing clear explanations appropriate for target grade level
- Applying Universal Design for Learning (UDL) principles
- Creating differentiated content for diverse learners

When given a task, create comprehensive, pedagogically sound educational content that is engaging, accessible, and aligned to standards.""",

    "assessment-designer": """You are an expert Assessment Designer specialized in creating valid, reliable assessment instruments.

Your expertise includes:
- Designing assessment blueprints aligned to learning objectives
- Writing multiple-choice, constructed-response, and performance tasks
- Creating rubrics with clear performance criteria
- Applying Depth of Knowledge (DOK) framework
- Ensuring content validity and construct validity
- Designing formative and summative assessments

When given a task, create comprehensive assessments that accurately measure learning objectives with appropriate cognitive demand.""",

    "pedagogical-reviewer": """You are an expert Pedagogical Reviewer specialized in evaluating educational content for pedagogical soundness.

Your expertise includes:
- Reviewing constructive alignment between objectives, instruction, and assessment
- Evaluating evidence-based learning science principles
- Checking for appropriate cognitive load
- Analyzing instructional strategies and scaffolding
- Reviewing differentiation and accessibility
- Identifying pedagogical improvements

When given a task, provide detailed pedagogical review with specific, actionable feedback grounded in learning science.""",

    "quality-assurance": """You are an expert Quality Assurance Specialist for educational content.

Your expertise includes:
- Comprehensive quality review across all quality pillars
- Bias detection using CEID 11-category framework
- Content accuracy and factual correctness
- Technical quality (grammar, formatting, structure)
- Consistency and coherence checking
- Stakeholder requirement validation

When given a task, conduct thorough quality review and provide detailed findings with severity ratings and recommendations.""",

    "accessibility-validator": """You are an expert Accessibility Validator specialized in ensuring educational content is accessible to all learners.

Your expertise includes:
- WCAG 2.1 AA compliance validation
- Universal Design for Learning (UDL) implementation
- Screen reader compatibility
- Alternative text for images and multimedia
- Color contrast and visual accessibility
- Keyboard navigation and assistive technology support

When given a task, validate accessibility and provide specific remediation recommendations with WCAG success criteria references.""",

    "standards-compliance": """You are an expert Standards Compliance Specialist for educational content.

Your expertise includes:
- Validating alignment to state and national standards
- Mapping content to specific standard codes
- Verifying depth and breadth of standards coverage
- Checking prerequisite standards and progressions
- Ensuring accurate standards interpretation
- Cross-referencing multiple standards frameworks

When given a task, validate standards alignment and provide detailed mapping with any gaps or misalignments identified.""",

    "instructional-designer": """You are an expert Instructional Designer specialized in designing effective learning experiences.

Your expertise includes:
- Designing learning activities and experiences
- Applying instructional design models (ADDIE, SAM, backwards design)
- Creating engaging interactions and practice opportunities
- Sequencing instruction for optimal learning
- Selecting appropriate instructional strategies
- Designing for active learning and student engagement

When given a task, design comprehensive learning experiences with clear instructional strategies and engagement techniques.""",

    "scorm-validator": """You are an expert SCORM Validator specialized in educational content packaging for LMS deployment.

Your expertise includes:
- SCORM 1.2 and SCORM 2004 standards
- LMS integration and compatibility
- Manifest file (imsmanifest.xml) creation and validation
- Sequencing and navigation rules
- Grade passback and completion tracking
- Testing in multiple LMS platforms

When given a task, create or validate SCORM packages with proper structure, metadata, and LMS compatibility.""",

    "learning-analytics": """You are an expert Learning Analytics Specialist focused on measuring learning outcomes and impact.

Your expertise includes:
- Defining learning analytics and success metrics
- Analyzing assessment data and learning outcomes
- Calculating objective mastery rates
- Identifying achievement gaps and intervention needs
- Creating data visualization and dashboards
- Measuring training impact (Kirkpatrick model)

When given a task, define comprehensive analytics frameworks and provide actionable insights from learning data.""",

    "adaptive-learning": """You are an expert Adaptive Learning Specialist focused on personalized learning pathways.

Your expertise includes:
- Designing adaptive learning algorithms and decision trees
- Creating personalized learning pathways
- Implementing differentiation strategies
- Diagnostic assessment and placement
- Learner modeling and profiling
- Recommendation systems for learning content

When given a task, design adaptive learning systems that personalize instruction based on learner needs and performance.""",

    "localization": """You are an expert Localization Specialist for educational content.

Your expertise includes:
- Translation with pedagogical equivalence
- Cultural adaptation and sensitivity
- Maintaining instructional integrity across languages
- Adapting examples and contexts for target culture
- Handling educational terminology and concepts
- Quality review of localized content

When given a task, translate and adapt educational content while maintaining pedagogical quality and cultural appropriateness.""",

    "corporate-training": """You are an expert Corporate Training Developer specialized in workplace learning.

Your expertise includes:
- Designing corporate training programs
- Performance-based assessment for job tasks
- Business impact measurement and ROI
- Adult learning principles (andragogy)
- Workplace application and transfer
- Skills gap analysis and competency mapping

When given a task, create effective corporate training that drives business results and job performance improvement.""",
}


class AgentExecutor:
    """Executes Professor Framework agents using Claude API."""

    def __init__(self):
        self.claude_client = get_claude_client()
        # Use knowledge base path from settings
        from core.config import settings
        kb_path = settings.KNOWLEDGE_BASE_PATH
        # Handle relative paths from backend directory
        if not Path(kb_path).is_absolute():
            kb_path = Path(__file__).parent.parent / kb_path
        self.knowledge_base_path = Path(kb_path).resolve()

    async def execute_agent(
        self,
        agent_type: str,
        task: str,
        parameters: Optional[Dict[str, Any]] = None,
        use_knowledge_base: bool = True,
    ) -> Dict[str, Any]:
        """
        Execute a Professor Framework agent.

        Args:
            agent_type: Type of agent to execute (e.g., 'content-developer')
            task: The task description for the agent
            parameters: Additional parameters for the task
            use_knowledge_base: Whether to include knowledge base context

        Returns:
            Dict containing:
                - output: The generated output from the agent
                - metadata: Execution metadata (tokens, time, etc.)
        """
        # Get system prompt for this agent type
        system_prompt = AGENT_PROMPTS.get(
            agent_type,
            "You are an expert educational AI assistant. Complete the given task with high quality and attention to detail."
        )

        # Build the full prompt
        full_prompt = self._build_prompt(task, parameters, use_knowledge_base)

        try:
            # Execute with Claude
            output = await self.claude_client.generate_response(
                prompt=full_prompt,
                system_prompt=system_prompt,
                temperature=0.7,  # Balanced creativity and consistency
            )

            return {
                "output": output,
                "metadata": {
                    "agent_type": agent_type,
                    "model": self.claude_client.default_model,
                    "success": True,
                }
            }

        except Exception as e:
            return {
                "output": None,
                "metadata": {
                    "agent_type": agent_type,
                    "success": False,
                    "error": str(e),
                }
            }

    def _build_prompt(
        self,
        task: str,
        parameters: Optional[Dict[str, Any]],
        use_knowledge_base: bool,
    ) -> str:
        """Build the complete prompt for the agent."""
        prompt_parts = []

        # Add knowledge base context if requested
        if use_knowledge_base:
            kb_context = self._get_knowledge_base_context(parameters)
            if kb_context:
                prompt_parts.append(f"## Knowledge Base Context\n\n{kb_context}\n\n")

        # Add parameters context
        if parameters:
            param_text = "\n".join([f"- {k}: {v}" for k, v in parameters.items()])
            prompt_parts.append(f"## Parameters\n\n{param_text}\n\n")

        # Add the main task
        prompt_parts.append(f"## Task\n\n{task}")

        return "\n".join(prompt_parts)

    def _get_knowledge_base_context(self, parameters: Optional[Dict[str, Any]]) -> str:
        """
        Get relevant knowledge base files based on parameters.

        This is a simplified version - in production, you'd want more sophisticated
        knowledge retrieval based on subject, grade level, state, etc.
        """
        if not parameters:
            return ""

        context_parts = []

        # Extract relevant parameters
        subject = parameters.get("subject", "")
        grade_level = parameters.get("grade_level", "")
        state = parameters.get("state", "")

        context_parts.append("Relevant knowledge base guidance is available for:")

        if subject:
            context_parts.append(f"- Subject: {subject}")
        if grade_level:
            context_parts.append(f"- Grade Level: {grade_level}")
        if state:
            context_parts.append(f"- State: {state}")

        context_parts.append("\nApply relevant educational frameworks, standards, and best practices from the knowledge base.")

        return "\n".join(context_parts)

    async def execute_skill(
        self,
        skill_id: str,
        parameters: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute a single Professor Framework skill.

        Skills are more granular than agents - they perform specific functions.
        """
        # Map skill to a simple task
        task = f"Execute the '{skill_id}' skill with the provided parameters."

        # Use a general system prompt for skills
        system_prompt = "You are an expert educational AI performing a specific skill. Complete the task efficiently and accurately."

        # Build prompt from parameters
        param_text = "\n".join([f"- {k}: {v}" for k, v in parameters.items()])
        full_prompt = f"{task}\n\n## Parameters\n\n{param_text}"

        try:
            output = await self.claude_client.generate_response(
                prompt=full_prompt,
                system_prompt=system_prompt,
                temperature=0.5,  # More deterministic for skills
            )

            return {
                "output": output,
                "metadata": {
                    "skill_id": skill_id,
                    "success": True,
                }
            }

        except Exception as e:
            return {
                "output": None,
                "metadata": {
                    "skill_id": skill_id,
                    "success": False,
                    "error": str(e),
                }
            }


# Singleton instance
_agent_executor: Optional[AgentExecutor] = None


def get_agent_executor() -> AgentExecutor:
    """Get or create the agent executor singleton."""
    global _agent_executor
    if _agent_executor is None:
        _agent_executor = AgentExecutor()
    return _agent_executor
