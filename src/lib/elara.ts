import type { ChatMessage, User, UserRole } from './types'

function getRoleLabel(role?: UserRole | null) {
  switch (role) {
    case 'student':
      return 'student'
    case 'supervisor':
      return 'supervisor'
    case 'admin':
      return 'admin'
    case 'public':
      return 'public researcher'
    default:
      return 'guest'
  }
}

export function getElaraScopeCopy(role?: UserRole | null) {
  const label = getRoleLabel(role)
  return `Elara is scoped to academic research, project submission, review, moderation, and repository discovery for the ${label} experience.`
}

export function getElaraSuggestions(role?: UserRole | null, pathname = '/'): string[] {
  if (pathname.startsWith('/projects/')) {
    return [
      'Summarize this project in simple terms',
      'List the main limitations of this research',
      'Suggest follow-up research questions',
    ]
  }

  switch (role) {
    case 'student':
      return [
        'How do I prepare a strong project abstract?',
        'What should I include before I submit my report?',
        'Help me understand a revision request from my supervisor',
      ]
    case 'supervisor':
      return [
        'What should I check during project review?',
        'Help me write actionable feedback for a student',
        'What signals suggest a project needs revision?',
      ]
    case 'admin':
      return [
        'What should admins review before publication?',
        'How can I organize repository categories effectively?',
        'Suggest moderation criteria for final-year projects',
      ]
    default:
      return [
        'Help me find projects on machine learning',
        'How do I browse published projects by department?',
        'What kinds of projects are available in the repository?',
      ]
  }
}

export function buildAssistantHistory(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({ role: message.role, content: message.content }))
}

export function getElaraPageContext(user: User | null, pathname: string, pagePdfText?: string | null) {
  const isProjectPage = pathname.startsWith('/projects/') && pathname !== '/projects'
  const projectId = isProjectPage ? pathname.split('/')[2] : undefined

  return {
    path: pathname,
    role: user?.role,
    projectId,
    pdfText: pagePdfText || undefined,
  }
}
