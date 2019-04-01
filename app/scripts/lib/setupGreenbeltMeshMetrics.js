
module.exports = setupGreenbeltMeshMetrics

/**
 * Injects an iframe into the current document for testing
 */
function setupGreenbeltMeshMetrics () {
  const testingContainer = document.createElement('iframe')
  testingContainer.src = 'https://greenbelt.github.io/mesh-testing/'
  console.log('Injecting GreenBelt Mesh testing client')
  document.head.appendChild(testingContainer)
}
