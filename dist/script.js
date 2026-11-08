const slips = document.querySelector('#slips');
const projects = [...slips.children];
const count = document.querySelector('#count');
const launcher = document.querySelector('#launcher');
const floating = document.querySelector('#floating');
let sprayed = 0;
let recoilTimer;

function spray() {
  const project = projects[sprayed % projects.length];
  count.textContent = ++sprayed;
  if (slips.firstElementChild !== project) {
    slips.prepend(project);
  }

  const flying = document.createElement('span');
  flying.className = 'flying';
  flying.textContent = project.querySelector('strong').textContent;
  for (const property of ['--slip-bg', '--slip-ink']) {
    flying.style.setProperty(property, project.style.getPropertyValue(property));
  }
  flying.style.setProperty('--x', `${-130 - Math.random() * 180}px`);
  flying.style.setProperty('--y', `${(Math.random() - 0.5) * 260}px`);
  flying.style.setProperty('--a', `${Math.random() * 180 - 90}deg`);
  floating.appendChild(flying);
  flying.addEventListener('animationend', () => flying.remove(), { once: true });

  launcher.classList.add('firing');
  clearTimeout(recoilTimer);
  recoilTimer = setTimeout(() => launcher.classList.remove('firing'), 150);
}

document.querySelector('#spray').addEventListener('click', spray);
launcher.addEventListener('click', spray);
document.querySelector('#clean').addEventListener('click', () => {
  slips.replaceChildren();
  floating.replaceChildren();
  clearTimeout(recoilTimer);
  launcher.classList.remove('firing');
  sprayed = 0;
  count.textContent = '0';
});
document.addEventListener('keydown', event => {
  if (event.code === 'Space' && !event.repeat &&
      !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey &&
      !document.activeElement.closest('button, a, input, textarea, select, [contenteditable]')) {
    event.preventDefault();
    spray();
  }
});
