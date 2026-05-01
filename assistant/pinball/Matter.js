
// Matter.js 모듈 불러오기
const { Engine, Render, Runner, Bodies, Composite } = Matter;

const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: { width: 800, height: 600, wireframes: false }
});

// 벽 만들기 (바닥)
const ground = Bodies.rectangle(400, 590, 810, 60, { isStatic: true });
// 장애물 못 만들기
const pin = Bodies.circle(400, 300, 10, { isStatic: true });

// 공 추가 (학생 객체 대용)
const ball = Bodies.circle(405, 50, 20, { restitution: 0.8 });

Composite.add(engine.world, [ground, pin, ball]);

Render.run(render);
Runner.run(Runner.create(), engine);
