import { RocketGeometry } from '../store'

export interface ParsedORK {
  name: string
  designer: string
  revision: string
  comments?: string
  components: ComponentDef[]
  stages: number
}

export interface ComponentDef {
  id: string
  name: string
  type: 'nosecone' | 'bodytube' | 'fin' | 'motor' | 'parachute' | 'other'
  length?: number
  radius?: number
  thickness?: number
  material?: string
  mass?: number
  position?: number
  stage?: number
}

/**
 * Parse OpenRocket .ork file (XML format)
 * Extracts rocket geometry, components, and properties
 */
export async function parseORK(orkText: string): Promise<ParsedORK | null> {
  try {
    // Simple regex-based XML parsing (xml2js requires more setup)
    const nameMatch = orkText.match(/<name>([^<]+)<\/name>/)
    const designerMatch = orkText.match(/<designer>([^<]+)<\/designer>/)
    const revisionMatch = orkText.match(/<revision>([^<]+)<\/revision>/)
    const commentMatch = orkText.match(/<comment>([^<]+)<\/comment>/)

    const components: ComponentDef[] = []
    let stageCount = 0

    // Parse nose cone
    const noseconeRegex = /<nosecone>([\s\S]*?)<\/nosecone>/g
    let match
    while ((match = noseconeRegex.exec(orkText)) !== null) {
      const content = match[1]
      const name = content.match(/<name>([^<]+)<\/name>/)?.[1] || 'Nose Cone'
      const length = parseFloat(content.match(/<length>([^<]+)<\/length>/)?.[1] || '0')
      const radius = parseFloat(content.match(/<aftradius>([^<]+)<\/aftradius>/)?.[1] || '0')
      const material = content.match(/<material[^>]*>([^<]+)<\/material>/)?.[1] || 'Fiberglass'

      components.push({
        id: Math.random().toString(),
        name,
        type: 'nosecone',
        length,
        radius,
        material,
      })
    }

    // Parse body tubes
    const bodytube = orkText.match(/<bodytube>([\s\S]*?)<\/bodytube>/g)
    bodytube?.forEach((tube) => {
      const name = tube.match(/<name>([^<]+)<\/name>/)?.[1] || 'Body Tube'
      const length = parseFloat(tube.match(/<length>([^<]+)<\/length>/)?.[1] || '0')
      const radius = parseFloat(tube.match(/<outerradius>([^<]+)<\/outerradius>/)?.[1] || '0')
      const thickness = parseFloat(tube.match(/<thickness>([^<]+)<\/thickness>/)?.[1] || '0.002')

      components.push({
        id: Math.random().toString(),
        name,
        type: 'bodytube',
        length,
        radius,
        thickness,
      })
    })

    // Parse fins
    const fins = orkText.match(/<fin>([\s\S]*?)<\/fin>/g)
    fins?.forEach((fin) => {
      const name = fin.match(/<name>([^<]+)<\/name>/)?.[1] || 'Fin'
      components.push({
        id: Math.random().toString(),
        name,
        type: 'fin',
      })
    })

    // Parse motors
    const motors = orkText.match(/<motor>([\s\S]*?)<\/motor>/g)
    motors?.forEach((motor) => {
      const name = motor.match(/<name>([^<]+)<\/name>/)?.[1] || 'Motor'
      components.push({
        id: Math.random().toString(),
        name,
        type: 'motor',
      })
    })

    // Count stages
    const stages = orkText.match(/<stage>/g)?.length || 1

    return {
      name: nameMatch?.[1] || 'Unknown Rocket',
      designer: designerMatch?.[1] || 'Unknown',
      revision: revisionMatch?.[1] || 'Unknown',
      comments: commentMatch?.[1],
      components,
      stages,
    }
  } catch (err) {
    console.error('Error parsing ORK file:', err)
    return null
  }
}

/**
 * Convert parsed ORK to RocketGeometry for 3D rendering
 */
export function orkToGeometry(parsed: ParsedORK): RocketGeometry {
  return {
    name: parsed.name,
    designer: parsed.designer,
    revision: parsed.revision,
    components: parsed.components.map((c) => ({
      name: c.name,
      type: c.type,
      length: c.length,
      radius: c.radius,
      material: c.material,
    })),
  }
}
