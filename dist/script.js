const slips = document.querySelector('#slips');
const projects = [...slips.children];
const count = document.querySelector('#count');
const sprayButton = document.querySelector('#spray');
const launcher = document.querySelector('#launcher');
const muzzle = document.querySelector('#muzzle');
const trigger = document.querySelector('#trigger');
const floating = document.querySelector('#floating');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let sprayed = 0;
let flight;
let queued = false;

function animateGrid(previousPositions) {
  for (const [slip, previous] of previousPositions) {
    const current = slip.getBoundingClientRect();
    const x = previous.left - current.left;
    const y = previous.top - current.top;
    if (x || y) {
      slip.animate([{ translate: `${x}px ${y}px` }, { translate: '0px 0px' }], {
        duration: 280,
        easing: 'cubic-bezier(.2,.75,.25,1)'
      });
    }
  }
}

function cubicPoint(start, outgoing, incoming, end, t) {
  const remaining = 1 - t;
  return remaining ** 3 * start + 3 * remaining ** 2 * t * outgoing +
    3 * remaining * t ** 2 * incoming + t ** 3 * end;
}

function launch(project) {
  const overlay = floating.getBoundingClientRect();
  const mouth = muzzle.getBoundingClientRect();
  const target = project.getBoundingClientRect();
  const startX = mouth.left + mouth.width / 2 - overlay.left;
  const startY = mouth.top + mouth.height / 2 - overlay.top;
  const endX = target.left + target.width / 2 - overlay.left;
  const endY = target.top + target.height / 2 - overlay.top;
  const kick = Math.min(105, Math.max(38, Math.hypot(endX - startX, endY - startY) * .22));
  const outgoingX = Math.max(14, startX - kick);
  const approach = Math.min(95, Math.max(25, Math.abs(endY - startY) * .28));

  const flying = project.cloneNode(true);
  flying.removeAttribute('href');
  flying.classList.add('flying');
  const { width, height } = getComputedStyle(project);
  Object.assign(flying.style, { width, height });
  const halfWidth = parseFloat(width) / 2;
  const halfHeight = parseFloat(height) / 2;
  project.classList.add('is-landing');
  floating.append(flying);

  const landingAngle = parseFloat(project.style.getPropertyValue('--r'));
  // Sample a curved flight using only transform and opacity during playback.
  const frames = Array.from({ length: 25 }, (_, index) => {
    const t = index / 24;
    const centerX = cubicPoint(startX, outgoingX, endX + kick * .48, endX, t);
    const y = cubicPoint(startY, startY + (startX - outgoingX) * .18, endY - approach, endY, t) - halfHeight;
    const turn = -11 * (1 - t) + landingAngle * t - 18 * Math.sin(2 * Math.PI * t) * (1 - t);
    const unfold = Math.max(0, 1 - 2 * t) ** 3;
    const swell = 1.5 * Math.sin(Math.PI * t) ** 2;
    const scaleX = 1 - .86 * unfold + swell;
    const scaleY = 1 - .48 * unfold + swell;
    const radians = turn * Math.PI / 180;
    const halfSpan = halfWidth * scaleX * Math.abs(Math.cos(radians)) +
      halfHeight * scaleY * Math.abs(Math.sin(radians));
    const inset = Math.min(halfSpan, overlay.width / 2);
    const x = Math.min(overlay.width - inset, Math.max(inset, centerX)) - halfWidth;
    return {
      transform: `translate3d(${x}px,${y}px,0) rotate(${turn}deg) scale(${scaleX},${scaleY})`,
      opacity: Math.min(1, t * 12)
    };
  });
  flight = flying.animate(frames, { duration: 550, easing: 'cubic-bezier(.18,.42,.26,1)', fill: 'both' });

  trigger.animate([
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(-16deg)', offset: .25 },
    { transform: 'rotate(0deg)' }
  ], { duration: 230, easing: 'ease-out' });

  launcher.animate([
    { translate: '0px 0px' },
    { translate: '8px -2px', offset: .22 },
    { translate: '0px 0px' }
  ], { duration: 230, easing: 'ease-out' });

  flight.onfinish = () => {
    project.classList.remove('is-landing');
    flying.remove();
    flight = undefined;
    if (queued) {
      queued = false;
      spray();
    }
  };
}

function spray() {
  if (flight) {
    queued = true;
    return;
  }

  const project = projects[sprayed % projects.length];
  const shouldAnimate = !reducedMotion.matches;
  const previousPositions = new Map();
  if (shouldAnimate) {
    for (const slip of slips.children) {
      if (slip !== project) previousPositions.set(slip, slip.getBoundingClientRect());
    }
  }

  count.textContent = ++sprayed;
  if (slips.firstElementChild !== project) slips.prepend(project);
  if (shouldAnimate) {
    animateGrid(previousPositions);
    launch(project);
  }
}

sprayButton.addEventListener('click', spray);
launcher.addEventListener('click', spray);
document.querySelector('#clean').addEventListener('click', event => {
  queued = false;
  flight?.cancel();
  flight = undefined;
  for (const project of projects) {
    project.classList.remove('is-landing');
    for (const animation of project.getAnimations()) animation.cancel();
  }
  slips.replaceChildren();
  floating.replaceChildren();
  sprayed = 0;
  count.textContent = '0';
  if (event.detail > 0) sprayButton.focus({ preventScroll: true });
});

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.code !== 'Space' ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

  const focused = document.activeElement;
  if (focused !== launcher && focused !== sprayButton &&
      focused.closest('button, a, input, textarea, select, [contenteditable]')) return;

  event.preventDefault();
  if (!event.repeat) spray();
});

window.addEventListener('resize', () => flight?.finish());
reducedMotion.addEventListener('change', () => flight?.finish());
