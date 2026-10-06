import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrollClock, cameraPose, letterWindow, wheelPixels } from '../public/ui/scroll-model.mjs';

test('continuous input reverses to the same pose, including after responsive resize', () => {
  const clock = createScrollClock(10000);
  for (let i = 0; i < 43; i++) clock.advance(7);
  const before = clock.progress;
  assert.ok(before > 0 && before < .05);
  clock.resize(15000);
  assert.equal(clock.progress, before);
  clock.advance(-before * clock.length);
  assert.ok(clock.progress < 1e-12);
  clock.advance(-500); assert.equal(clock.progress, 0);
  clock.advance(1e8); assert.equal(clock.progress, 1);
  clock.advance(-100); assert.ok(clock.progress < 1);
});
test('wheel units have equivalent physical distance, without burst locks or snapping', () => {
  assert.equal(wheelPixels(80, 0, 800), wheelPixels(5, 1, 800));
  assert.equal(wheelPixels(1, 2, 800), 800);
  const clock = createScrollClock(8000);
  clock.advance(1); assert.equal(clock.progress, .000125);
  clock.advance(1); assert.equal(clock.progress, .00025);
});
test('scroll orbit preserves the approved cover framing and constant architectural radius', () => {
  for (const [width, height] of [[390,844],[360,640],[430,932],[1280,800],[1920,1080]]) {
    const start = cameraPose(width,height,0);
    const distance = pose => Math.hypot(...pose.position.map((value,i) => value - pose.target[i]));
    assert.equal(start.fov,98);
    const end = cameraPose(width,height,1);
    assert.deepEqual(start.target,end.target);
    assert.ok(Math.abs(distance(start)-distance(end)) < 1e-9);
    let last = start;
    for(let step = 1; step <= 1000; step++) {
      const pose = cameraPose(width,height,step/1000);
      assert.ok(Math.hypot(...pose.position.map((value,i) => value-last.position[i])) < .03);
      last = pose;
    }
    const a = start.position.map((v,i)=>v-start.target[i]);
    const b = end.position.map((v,i)=>v-end.target[i]);
    const angle = Math.acos((a[0]*b[0]+a[2]*b[2])/(Math.hypot(a[0],a[2])*Math.hypot(b[0],b[2]))) * 180/Math.PI;
    assert.ok(Math.abs(angle-6) < 1e-9);
  }
  assert.deepEqual(cameraPose(390,844,0).position,[-10.9,126.4,-90]);
});
test('each corresponding spine character enters during its own monumental turn', () => {
  const windows = Array.from({length:14},(_,i)=>letterWindow(i));
  windows.forEach((window,index) => {
    const revealStart = window.start + window.turn * .52;
    assert.ok(revealStart > window.start && revealStart < window.start + window.turn);
    assert.ok(revealStart + window.reveal <= window.start + window.turn + .002);
    if(index) assert.ok(window.start > windows[index-1].start);
  });
  assert.ok(windows[13].start + windows[13].turn < .11);
});
