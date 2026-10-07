import type { CertificateDesign, BackgroundPatternId } from './certificateStyles';

/**
 * Draws the selected background pattern on the certificate canvas
 */
export function drawBackgroundPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  patternId: BackgroundPatternId,
  primaryColor: string,
  secondaryColor: string
) {
  ctx.save();

  if (patternId === 'guilloche') {
    // Banknote security micro-guilloché wavy curves
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.07)';
    const centerY = height * 0.48;
    for (let r = 80; r <= 850; r += 28) {
      ctx.beginPath();
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.02) {
        const wave = Math.sin(theta * 14) * 16 + Math.cos(theta * 28) * 8;
        const x = width / 2 + (r + wave) * Math.cos(theta) * 1.35;
        const y = centerY + (r + wave) * Math.sin(theta);
        if (theta === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else if (patternId === 'girih') {
    // Uzbek national 8-pointed star & geometric interlaced lattice
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.08)';
    ctx.lineWidth = 1.4;
    const cx = width / 2;
    const cy = height * 0.48;
    for (let radius = 120; radius <= 780; radius += 90) {
      // 8-pointed star
      ctx.beginPath();
      const points = 16;
      for (let i = 0; i <= points; i++) {
        const angle = (i * Math.PI) / 8;
        const r = i % 2 === 0 ? radius : radius * 0.72;
        const x = cx + r * Math.cos(angle) * 1.3;
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Interlocking octagons
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + Math.PI / 8;
        const x = cx + radius * 0.88 * Math.cos(angle) * 1.3;
        const y = cy + radius * 0.88 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else if (patternId === 'tech_nodes') {
    // High-tech chemical molecular nodes and grid connections
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 1.2;

    const stepX = 140;
    const stepY = 120;
    for (let x = 200; x < width - 200; x += stepX) {
      for (let y = 180; y < height - 180; y += stepY) {
        const jitterX = Math.sin(x * 0.05 + y * 0.05) * 20;
        const jitterY = Math.cos(x * 0.05 - y * 0.05) * 20;
        const px = x + jitterX;
        const py = y + jitterY;

        // node dot
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();

        // horizontal and diagonal bonds
        if (x + stepX < width - 200 && (x + y) % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + stepX, py + (jitterY > 0 ? 30 : -30));
          ctx.stroke();
        }
      }
    }
  } else if (patternId === 'parchment') {
    // Academic parchment micro-lattice & subtle antique texture
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.05)';
    ctx.lineWidth = 0.8;
    for (let y = 140; y < height - 140; y += 40) {
      ctx.beginPath();
      ctx.moveTo(160, y);
      ctx.lineTo(width - 160, y);
      ctx.stroke();
    }
    for (let x = 160; x < width - 160; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 140);
      ctx.lineTo(x, height - 140);
      ctx.stroke();
    }
  } else if (patternId === 'sunburst') {
    // Radiant sunburst flare from center
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.07)';
    ctx.lineWidth = 1.2;
    const cx = width / 2;
    const cy = height * 0.48;
    const rays = 72;
    for (let i = 0; i < rays; i++) {
      const angle = (i * Math.PI * 2) / rays;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 120, cy + Math.sin(angle) * 120);
      ctx.lineTo(cx + Math.cos(angle) * 1200, cy + Math.sin(angle) * 950);
      ctx.stroke();
    }
  } else if (patternId === 'dots_grid') {
    // Modern architectural minimalist dot grid
    ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
    const spacing = 48;
    for (let x = 180; x < width - 180; x += spacing) {
      for (let y = 160; y < height - 160; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (patternId === 'concentric') {
    // Concentric security circles
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.06)';
    ctx.lineWidth = 1.2;
    const cx = width / 2;
    const cy = height * 0.48;
    for (let r = 100; r < 900; r += 45) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.35, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (patternId === 'minimal_clean') {
    // Minimal clean: just a single subtle institutional watermark ring
    ctx.strokeStyle = 'rgba(20, 83, 45, 0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.48, 540, 400, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.48, 520, 385, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the high-resolution frame according to the chosen certificate design
 */
export function drawCertificateFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  design: CertificateDesign
) {
  ctx.save();

  const { primaryColor, secondaryColor, accentColor, id } = design;

  if (id === 'presidential_emerald') {
    // Heavy regal emerald frame flanked by double gold borders and ornamental gold corner shields
    // Outer emerald border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 22;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Inner gold pinstripe
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(78, 78, width - 156, height - 156);

    // Thin inner emerald line
    ctx.strokeStyle = 'rgba(6, 78, 59, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(92, 92, width - 184, height - 184);

    // Fine inner gold line
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(102, 102, width - 204, height - 204);

    // 4 Corner Gold Shields with 8-pointed star
    drawPresidentialCornerShield(ctx, 102, 102, secondaryColor, primaryColor);
    drawPresidentialCornerShield(ctx, width - 102, 102, secondaryColor, primaryColor);
    drawPresidentialCornerShield(ctx, 102, height - 102, secondaryColor, primaryColor);
    drawPresidentialCornerShield(ctx, width - 102, height - 102, secondaryColor, primaryColor);
  } else if (id === 'modern_minimal') {
    // Sleek modern geometric frame: top & bottom deep slate bars with teal accent stripe
    ctx.fillStyle = primaryColor;
    // Top banner bar
    ctx.fillRect(50, 50, width - 100, 14);
    // Bottom banner bar
    ctx.fillRect(50, height - 64, width - 100, 14);

    // Teal highlight stripes
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(50, 66, width - 100, 4);
    ctx.fillRect(50, height - 70, width - 100, 4);

    // Hairline vertical borders
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 75);
    ctx.lineTo(60, height - 75);
    ctx.moveTo(width - 60, 75);
    ctx.lineTo(width - 60, height - 75);
    ctx.stroke();

    // Corner tech notches
    drawModernCornerNotch(ctx, 60, 75, secondaryColor);
    drawModernCornerNotch(ctx, width - 60, 75, secondaryColor);
    drawModernCornerNotch(ctx, 60, height - 75, secondaryColor);
    drawModernCornerNotch(ctx, width - 60, height - 75, secondaryColor);
  } else if (id === 'national_girih') {
    // Authentic Uzbek Girih oriental frame
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 16;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(84, 84, width - 168, height - 168);

    // Intricate Girih 8-point corner brackets
    drawGirihCornerOrnament(ctx, 84, 84, secondaryColor, primaryColor);
    drawGirihCornerOrnament(ctx, width - 84, 84, secondaryColor, primaryColor);
    drawGirihCornerOrnament(ctx, 84, height - 84, secondaryColor, primaryColor);
    drawGirihCornerOrnament(ctx, width - 84, height - 84, secondaryColor, primaryColor);
  } else if (id === 'academic_burgundy') {
    // Collegiate burgundy double border with fluted column corner blocks
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 20;
    ctx.strokeRect(58, 58, width - 116, height - 116);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(76, 76, width - 152, height - 152);

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(90, 90, width - 180, height - 180);

    drawCollegiateCornerBlock(ctx, 76, 76, primaryColor, secondaryColor);
    drawCollegiateCornerBlock(ctx, width - 76, 76, primaryColor, secondaryColor);
    drawCollegiateCornerBlock(ctx, 76, height - 76, primaryColor, secondaryColor);
    drawCollegiateCornerBlock(ctx, width - 76, height - 76, primaryColor, secondaryColor);
  } else if (id === 'innovation_tech') {
    // Futuristic cyber-beveled frame with electric indigo & cyan crosshairs
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 14;
    ctx.beginPath();
    const cut = 50;
    // Beveled polygon
    ctx.moveTo(60 + cut, 60);
    ctx.lineTo(width - 60 - cut, 60);
    ctx.lineTo(width - 60, 60 + cut);
    ctx.lineTo(width - 60, height - 60 - cut);
    ctx.lineTo(width - 60 - cut, height - 60);
    ctx.lineTo(60 + cut, height - 60);
    ctx.lineTo(60, height - 60 - cut);
    ctx.lineTo(60, 60 + cut);
    ctx.closePath();
    ctx.stroke();

    // Inner neon cyan trace
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const cut2 = 45;
    ctx.moveTo(80 + cut2, 80);
    ctx.lineTo(width - 80 - cut2, 80);
    ctx.lineTo(width - 80, 80 + cut2);
    ctx.lineTo(width - 80, height - 80 - cut2);
    ctx.lineTo(width - 80 - cut2, height - 80);
    ctx.lineTo(80 + cut2, height - 80);
    ctx.lineTo(80, height - 80 - cut2);
    ctx.lineTo(80, 80 + cut2);
    ctx.closePath();
    ctx.stroke();

    // High-tech target brackets
    drawTechCrosshairCorner(ctx, 80, 80, accentColor);
    drawTechCrosshairCorner(ctx, width - 80, 80, accentColor);
    drawTechCrosshairCorner(ctx, 80, height - 80, accentColor);
    drawTechCrosshairCorner(ctx, width - 80, height - 80, accentColor);
  } else if (id === 'luxe_platinum') {
    // Radiant double gold ribbon with platinum inlays
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 18;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = '#94a3b8'; // Platinum
    ctx.lineWidth = 3;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(84, 84, width - 168, height - 168);

    drawStarCornerBadge(ctx, 84, 84, secondaryColor);
    drawStarCornerBadge(ctx, width - 84, 84, secondaryColor);
    drawStarCornerBadge(ctx, 84, height - 84, secondaryColor);
    drawStarCornerBadge(ctx, width - 84, height - 84, secondaryColor);
  } else if (id === 'sapphire_night') {
    // Deep midnight sapphire frame with constellation corner brackets
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 18;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(85, 85, width - 170, height - 170);

    drawSapphireCornerConstellation(ctx, 85, 85, accentColor);
    drawSapphireCornerConstellation(ctx, width - 85, 85, accentColor);
    drawSapphireCornerConstellation(ctx, 85, height - 85, accentColor);
    drawSapphireCornerConstellation(ctx, width - 85, height - 85, accentColor);
  } else if (id === 'diplomatic_ruby') {
    // Diplomatic ruby frame with fine silver filigree inlays
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 20;
    ctx.strokeRect(58, 58, width - 116, height - 116);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(76, 76, width - 152, height - 152);

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(88, 88, width - 176, height - 176);

    drawDiplomaticCornerShield(ctx, 88, 88, primaryColor);
    drawDiplomaticCornerShield(ctx, width - 88, 88, primaryColor);
    drawDiplomaticCornerShield(ctx, 88, height - 88, primaryColor);
    drawDiplomaticCornerShield(ctx, width - 88, height - 88, primaryColor);
  } else if (id === 'eco_emerald') {
    // Deep forest green natural frame with stylized laurel garlands
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 18;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(85, 85, width - 170, height - 170);

    drawEcoCornerGarland(ctx, 85, 85, accentColor, secondaryColor);
    drawEcoCornerGarland(ctx, width - 85, 85, accentColor, secondaryColor);
    drawEcoCornerGarland(ctx, 85, height - 85, accentColor, secondaryColor);
    drawEcoCornerGarland(ctx, width - 85, height - 85, accentColor, secondaryColor);
  } else {
    // Standard Royal Navy & Gold classical architectural frame
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 18;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    ctx.strokeStyle = 'rgba(11, 31, 58, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(84, 84, width - 168, height - 168);

    drawClassicRoyalDiamondCorner(ctx, 84, 84, secondaryColor);
    drawClassicRoyalDiamondCorner(ctx, width - 84, 84, secondaryColor);
    drawClassicRoyalDiamondCorner(ctx, 84, height - 84, secondaryColor);
    drawClassicRoyalDiamondCorner(ctx, width - 84, height - 84, secondaryColor);
  }

  ctx.restore();
}

/**
 * Draws the ornamental divider under the university title
 */
export function drawCertificateHeaderDivider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  design: CertificateDesign
) {
  ctx.save();
  const half = width / 2;
  const { secondaryColor, primaryColor } = design;

  // Thin outer line
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - half, cy);
  ctx.lineTo(cx + half, cy);
  ctx.stroke();

  // Bold inner accent line
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx - half * 0.45, cy);
  ctx.lineTo(cx + half * 0.45, cy);
  ctx.stroke();

  // Centerpiece diamond / star
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 9);
  ctx.lineTo(cx + 9, cy);
  ctx.lineTo(cx, cy + 9);
  ctx.lineTo(cx - 9, cy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the official academic medal / seal customized for each of the 10 designs
 */
export function drawAwardMedalForDesign(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  awardLevel: string,
  design: CertificateDesign
) {
  ctx.save();
  const { primaryColor, secondaryColor, accentColor, id } = design;

  // Outer drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  // Outer serrated / gear circle or star points
  ctx.fillStyle = secondaryColor;
  const teeth = id === 'national_girih' || id === 'presidential_emerald' ? 32 : 48;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const angle = (i * Math.PI * 2) / teeth;
    const r = i % 2 === 0 ? radius : radius - 9;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Gold / Accent ring
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner deep background circle
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 16, 0, Math.PI * 2);
  ctx.fill();

  // Secondary fine ring
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 24, 0, Math.PI * 2);
  ctx.stroke();

  // Center Emblem: Star, Book, Atom, or Laurel
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (id === 'innovation_tech') {
    // Molecular / Atom electron orbit symbol
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 32, 14, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 32, 14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'academic_burgundy') {
    // Open Book / Torch
    ctx.fillStyle = secondaryColor;
    ctx.font = '36px serif';
    ctx.fillText('📖', cx, cy - 8);
  } else if (id === 'national_girih' || id === 'presidential_emerald') {
    // 8-pointed star in center
    drawCenter8PointStar(ctx, cx, cy - 8, 28, secondaryColor);
  } else if (id === 'eco_emerald') {
    // Sprout / Flask
    ctx.fillStyle = '#ffffff';
    ctx.font = '34px serif';
    ctx.fillText('🌱', cx, cy - 8);
  } else {
    // Classic 5-point star
    drawCenterStar(ctx, cx, cy - 8, 5, 26, 13, secondaryColor);
  }

  // Text inside medal
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Times New Roman", Georgia, serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('YANGIYER FILIALI', cx, cy + 34);

  ctx.fillStyle = secondaryColor;
  ctx.font = 'bold 12px system-ui, sans-serif';
  const cleanBadge = (awardLevel || 'RASMIY MUHR').toUpperCase();
  const truncated = cleanBadge.length > 22 ? cleanBadge.substring(0, 20) + '..' : cleanBadge;
  ctx.fillText(truncated, cx, cy + 54);

  ctx.restore();
}

// ----------------- CORNER DRAWING HELPERS -----------------

function drawPresidentialCornerShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  goldColor: string,
  emeraldColor: string
) {
  ctx.save();
  ctx.fillStyle = emeraldColor;
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 8-pointed star
  drawCenter8PointStar(ctx, x, y, 14, goldColor);
  ctx.restore();
}

function drawModernCornerNotch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGirihCornerOrnament(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  goldColor: string,
  cyanColor: string
) {
  ctx.save();
  ctx.strokeStyle = goldColor;
  ctx.fillStyle = cyanColor;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawCenter8PointStar(ctx, x, y, 15, goldColor);
  ctx.restore();
}

function drawCollegiateCornerBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  burgundyColor: string,
  goldColor: string
) {
  ctx.save();
  ctx.fillStyle = burgundyColor;
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2.5;
  ctx.fillRect(x - 20, y - 20, 40, 40);
  ctx.strokeRect(x - 20, y - 20, 40, 40);

  ctx.fillStyle = goldColor;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTechCrosshairCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  const size = 26;

  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStarCornerBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  goldColor: string
) {
  ctx.save();
  ctx.fillStyle = goldColor;
  drawCenterStar(ctx, x, y, 5, 18, 9, goldColor);
  ctx.restore();
}

function drawSapphireCornerConstellation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDiplomaticCornerShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rubyColor: string
) {
  ctx.save();
  ctx.fillStyle = rubyColor;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEcoCornerGarland(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  greenColor: string,
  bronzeColor: string
) {
  ctx.save();
  ctx.fillStyle = greenColor;
  ctx.strokeStyle = bronzeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = bronzeColor;
  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌿', x, y);
  ctx.restore();
}

function drawClassicRoyalDiamondCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  goldColor: string
) {
  ctx.save();
  ctx.fillStyle = '#0b1f3a';
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + 22, y);
  ctx.lineTo(x, y + 22);
  ctx.lineTo(x - 22, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = goldColor;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCenterStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string
) {
  ctx.save();
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.restore();
}

function drawCenter8PointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const r = i % 2 === 0 ? radius : radius * 0.55;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
