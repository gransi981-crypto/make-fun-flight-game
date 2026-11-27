// The aircraft itself: a bush-plane courier drawn with canvas paths —
// fuselage, wings, tail, spinning prop, gear and nav lights — banked and
// pitched with the flight model so the pilot can read the plane at a glance.
export function drawPlane(ctx, cx, cy, scale, roll, pitch, gearDown, time) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-roll * 0.85);
  ctx.scale(scale, scale);
  // Slight nose-up with pitch.
  ctx.rotate(-pitch * 0.35);

  const body = ctx.createLinearGradient(0, -14, 0, 14);
  body.addColorStop(0, '#f7c948');
  body.addColorStop(0.55, '#ef8f2e');
  body.addColorStop(1, '#c25e1e');
  const wingGrad = ctx.createLinearGradient(0, -60, 0, 60);
  wingGrad.addColorStop(0, '#fbf3df');
  wingGrad.addColorStop(1, '#e8d9b0');

  // Far wing (behind the fuselage).
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(-64, -26);
  ctx.lineTo(-72, -18);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a8842f';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tail fin and stabiliser.
  ctx.fillStyle = '#b3402a';
  ctx.beginPath();
  ctx.moveTo(52, -2);
  ctx.lineTo(74, -26);
  ctx.lineTo(82, -24);
  ctx.lineTo(66, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(56, 2);
  ctx.lineTo(84, -8);
  ctx.lineTo(88, -2);
  ctx.lineTo(60, 8);
  ctx.closePath();
  ctx.fill();

  // Fuselage: tapered body with a white roof stripe.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-58, 0);
  ctx.quadraticCurveTo(-52, -11, -30, -12);
  ctx.lineTo(38, -11);
  ctx.quadraticCurveTo(58, -9, 62, -2);
  ctx.quadraticCurveTo(58, 8, 40, 11);
  ctx.lineTo(-28, 12);
  ctx.quadraticCurveTo(-52, 11, -58, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7a3c10';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fdf6e3';
  ctx.beginPath();
  ctx.moveTo(-28, -12);
  ctx.lineTo(38, -11);
  ctx.lineTo(44, -6);
  ctx.lineTo(-26, -7);
  ctx.closePath();
  ctx.fill();

  // Cockpit windows.
  ctx.fillStyle = '#17324a';
  ctx.beginPath();
  ctx.moveTo(-34, -11);
  ctx.lineTo(-16, -11);
  ctx.lineTo(-12, -4);
  ctx.lineTo(-30, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(-32, -10);
  ctx.lineTo(-18, -10);
  ctx.lineTo(-16, -6);
  ctx.lineTo(-30, -6);
  ctx.closePath();
  ctx.fill();

  // Near wing.
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(-58, 34);
  ctx.lineTo(-66, 26);
  ctx.lineTo(-8, -4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a8842f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Red tip on the near wing, green on the far one.
  ctx.fillStyle = '#d23b2e';
  ctx.beginPath();
  ctx.moveTo(-58, 34);
  ctx.lineTo(-66, 26);
  ctx.lineTo(-62, 22);
  ctx.lineTo(-54, 30);
  ctx.closePath();
  ctx.fill();

  // Registration.
  ctx.fillStyle = '#5a2c08';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N7-MERIDIAN', 8, 8);

  // Propeller: translucent disc with two blades, spinning with time.
  const propAngle = time * 28;
  ctx.save();
  ctx.translate(-60, 0);
  ctx.rotate(propAngle);
  ctx.fillStyle = 'rgba(40,40,40,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(30,30,30,0.55)';
  ctx.fillRect(-2, -26, 4, 52);
  ctx.restore();
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.arc(-60, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Landing gear.
  if (gearDown) {
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, 10);
    ctx.lineTo(-14, 22);
    ctx.moveTo(28, 10);
    ctx.lineTo(32, 22);
    ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-14, 24, 5, 0, Math.PI * 2);
    ctx.arc(32, 24, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nav lights: left red, right green, blinking with time.
  const blink = Math.sin(time * 6) > 0;
  if (blink) {
    ctx.fillStyle = '#ff2e2e';
    ctx.beginPath();
    ctx.arc(-66, -18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2eff5e';
    ctx.beginPath();
    ctx.arc(-62, 24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
