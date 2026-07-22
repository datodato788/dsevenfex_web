async function loadAndRenderTools() {
  try {
    const response = await fetch('./src/tools_card.json');
    if (!response.ok) {
      throw new Error(response.status);
    }

    const tools = await response.json();
    const container = document.querySelector('.tools-grid');

    if (container) {
      container.innerHTML = tools.map(tool => `
        <article class="tool-card reveal">
          <div class="tool-header">
            <span class="tool-badge">${tool.badge}</span>
            <span class="tool-status">${tool.status}</span>
          </div>
          <h3>${tool.name}</h3>
          <p>${tool.about}</p>
          <ul class="tool-features">
            ${tool.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
          <a href="/discord" class="btn btn-tool">View Details</a>
        </article>
      `).join('');


      document.querySelectorAll('.tools-grid .reveal').forEach(el => {
        el.classList.add('visible');
      });
    }
  } catch (error) {
    console.error(error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndRenderTools);
} else {
  loadAndRenderTools();
}