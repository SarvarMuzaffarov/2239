import type { CertificateDesign, BackgroundPatternId, CertificateLayoutType } from './certificateStyles';

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
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.08)';
    const centerY = height * 0.48;
    for (let r = 80; r <= 880; r += 28) {
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
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.09)';
    ctx.lineWidth = 1.4;
    const cx = width / 2;
    const cy = height * 0.48;
    for (let radius = 120; radius <= 800; radius += 90) {
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
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.09)';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
    ctx.lineWidth = 1.2;

    const stepX = 140;
    const stepY = 120;
    for (let x = 200; x < width - 200; x += stepX) {
      for (let y = 180; y < height - 180; y += stepY) {
        const jitterX = Math.sin(x * 0.05 + y * 0.05) * 20;
        const jitterY = Math.cos(x * 0.05 - y * 0.05) * 20;
        const px = x + jitterX;
        const py = y + jitterY;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();

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
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.06)';
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
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.08)';
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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
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
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.07)';
    ctx.lineWidth = 1.2;
    const cx = width / 2;
    const cy = height * 0.48;
    for (let r = 100; r < 900; r += 45) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.35, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (patternId === 'minimal_clean') {
    // Minimal clean: subtle institutional watermark rings
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.48, 540, 400, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.48, 520, 385, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (patternId === 'argyle_diamonds') {
    // Intersecting diagonal diamond grid
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.06)';
    ctx.lineWidth = 1.2;
    const step = 70;
    for (let x = -height; x < width + height; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + height, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  } else if (patternId === 'royal_damask') {
    // Classical royal damask florets
    ctx.fillStyle = 'rgba(180, 83, 9, 0.05)';
    const stepX = 160;
    const stepY = 140;
    for (let x = 120; x < width - 120; x += stepX) {
      for (let y = 120; y < height - 120; y += stepY) {
        // Draw tiny fleur-de-lis / rosette motif
        ctx.beginPath();
        ctx.arc(x, y - 6, 4, 0, Math.PI * 2);
        ctx.arc(x - 6, y + 4, 3, 0, Math.PI * 2);
        ctx.arc(x + 6, y + 4, 3, 0, Math.PI * 2);
        ctx.arc(x, y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * Draws the master frame and architectural structures specific to the chosen layout
 */
export function drawCertificateFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  design: CertificateDesign
) {
  ctx.save();
  const { primaryColor, secondaryColor, accentColor, layoutType } = design;

  if (layoutType === 'sidebar') {
    // ----------------------------------------------------
    // LAYOUT 1: SPLIT VERTICAL SIDEBAR
    // ----------------------------------------------------
    const sidebarWidth = 620;

    // Solid deep colored sidebar with subtle gradient
    const sideGrad = ctx.createLinearGradient(0, 0, sidebarWidth, height);
    sideGrad.addColorStop(0, primaryColor);
    sideGrad.addColorStop(1, '#020617');
    ctx.fillStyle = sideGrad;
    ctx.fillRect(0, 0, sidebarWidth, height);

    // Sidebar gold vertical divider accent bar
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(sidebarWidth - 8, 0, 8, height);

    // Inner subtle vertical hairline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(35, 35);
    ctx.lineTo(35, height - 35);
    ctx.moveTo(sidebarWidth - 35, 35);
    ctx.lineTo(sidebarWidth - 35, height - 35);
    ctx.stroke();

    // Top Institutional emblem inside sidebar
    drawSidebarInstituteEmblem(ctx, sidebarWidth / 2, 280, secondaryColor);

    // Vertical rotated creed text
    ctx.save();
    ctx.translate(sidebarWidth / 2, 850);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI YANGIYER FILIALI', 0, 0);
    ctx.restore();

    // Right main area outer hairline frame
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sidebarWidth + 40, 40, width - sidebarWidth - 80, height - 80);

    // Right area corner notches
    drawModernCornerNotch(ctx, sidebarWidth + 40, 40, secondaryColor);
    drawModernCornerNotch(ctx, width - 40, 40, secondaryColor);
    drawModernCornerNotch(ctx, sidebarWidth + 40, height - 40, secondaryColor);
    drawModernCornerNotch(ctx, width - 40, height - 40, secondaryColor);
  } else if (layoutType === 'arch') {
    // ----------------------------------------------------
    // LAYOUT 2: UZBEK REGISTON ARCH & PORTAL
    // ----------------------------------------------------
    // Outer border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 16;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    // The Architectural Mehrob / Dome Arch
    const archCx = width / 2;
    const archTopY = 160;
    const colLeftX = 180;
    const colRightX = width - 180;
    const archSpringY = 620;

    // Draw the monumental pointed arch
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(colLeftX, height - 100);
    ctx.lineTo(colLeftX, archSpringY);
    // Left arch curve to pointed apex
    ctx.bezierCurveTo(colLeftX, archTopY + 120, archCx - 180, archTopY, archCx, archTopY);
    // Right arch curve from pointed apex
    ctx.bezierCurveTo(archCx + 180, archTopY, colRightX, archTopY + 120, colRightX, archSpringY);
    ctx.lineTo(colRightX, height - 100);
    ctx.stroke();

    // Inner arch line
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(colLeftX + 16, height - 100);
    ctx.lineTo(colLeftX + 16, archSpringY);
    ctx.bezierCurveTo(colLeftX + 16, archTopY + 132, archCx - 165, archTopY + 16, archCx, archTopY + 16);
    ctx.bezierCurveTo(archCx + 165, archTopY + 16, colRightX - 16, archTopY + 132, colRightX - 16, archSpringY);
    ctx.lineTo(colRightX - 16, height - 100);
    ctx.stroke();

    // Spandrel ornaments (top left and top right outside the arch)
    drawGirihCornerOrnament(ctx, 120, 120, secondaryColor, primaryColor);
    drawGirihCornerOrnament(ctx, width - 120, 120, secondaryColor, primaryColor);
    drawGirihCornerOrnament(ctx, 120, height - 120, secondaryColor, primaryColor);
    drawGirihCornerOrnament(ctx, width - 120, height - 120, secondaryColor, primaryColor);

    // Arch Keystone Gold 8-Point Star at Apex
    drawCenter8PointStar(ctx, archCx, archTopY, 26, secondaryColor);
  } else if (layoutType === 'bands') {
    // ----------------------------------------------------
    // LAYOUT 3: HEADER & FOOTER SOLID BANDS
    // ----------------------------------------------------
    const headerHeight = 330;
    const footerHeight = 350;

    // Top Solid Banner
    const topGrad = ctx.createLinearGradient(0, 0, width, headerHeight);
    topGrad.addColorStop(0, primaryColor);
    topGrad.addColorStop(1, '#020617');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, headerHeight);

    // Header Gold Border Line
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(0, headerHeight, width, 8);

    // Bottom Solid Banner
    const botGrad = ctx.createLinearGradient(0, height - footerHeight, width, height);
    botGrad.addColorStop(0, '#020617');
    botGrad.addColorStop(1, primaryColor);
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, height - footerHeight, width, footerHeight);

    // Footer Gold Border Line
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(0, height - footerHeight - 8, width, 8);

    // Center area side borders
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, headerHeight + 20, width - 80, height - headerHeight - footerHeight - 40);
  } else if (layoutType === 'ribbon') {
    // ----------------------------------------------------
    // LAYOUT 4: DIAGONAL RIBBON & HANGING SEAL
    // ----------------------------------------------------
    // Symmetrical outer frame
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 18;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    // Diagonal Silk Ribbon Banner across top-left corner
    ctx.save();
    const ribbonCut = 480;
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(0, ribbonCut);
    ctx.lineTo(ribbonCut, 0);
    ctx.lineTo(ribbonCut + 110, 0);
    ctx.lineTo(0, ribbonCut + 110);
    ctx.closePath();
    ctx.fill();

    // Gold ribbon edge lines
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, ribbonCut);
    ctx.lineTo(ribbonCut, 0);
    ctx.moveTo(0, ribbonCut + 110);
    ctx.lineTo(ribbonCut + 110, 0);
    ctx.stroke();

    // Text along diagonal ribbon
    ctx.translate(220, 220);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('TKTI YANGIYER • RASMIY', 0, 0);
    ctx.restore();

    // Corner rosettes on other corners
    drawClassicRoyalDiamondCorner(ctx, width - 84, 84, secondaryColor);
    drawClassicRoyalDiamondCorner(ctx, 84, height - 84, secondaryColor);
  } else if (layoutType === 'decree') {
    // ----------------------------------------------------
    // LAYOUT 5: GOVERNMENT DECREE / DIPLOMA STANDARD
    // ----------------------------------------------------
    // Strict official state frame
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 22;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(78, 78, width - 156, height - 156);

    ctx.strokeStyle = 'rgba(6, 78, 59, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(92, 92, width - 184, height - 184);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(102, 102, width - 204, height - 204);

    // 4 Corner Gold Shields with 8-pointed star
    drawPresidentialCornerShield(ctx, 102, 102, secondaryColor, primaryColor);
    drawPresidentialCornerShield(ctx, width - 102, 102, secondaryColor, primaryColor);
    drawPresidentialCornerShield(ctx, 102, height - 102, secondaryColor, primaryColor);
    drawPresidentialCornerShield(ctx, width - 102, height - 102, secondaryColor, primaryColor);
  } else if (layoutType === 'cyber') {
    // ----------------------------------------------------
    // LAYOUT 6: CYBER ANGLED TECH & POLAR CHIPS
    // ----------------------------------------------------
    const cut = 60;
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 14;
    ctx.beginPath();
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
    const cut2 = 52;
    ctx.beginPath();
    ctx.moveTo(82 + cut2, 82);
    ctx.lineTo(width - 82 - cut2, 82);
    ctx.lineTo(width - 82, 82 + cut2);
    ctx.lineTo(width - 82, height - 82 - cut2);
    ctx.lineTo(width - 82 - cut2, height - 82);
    ctx.lineTo(82 + cut2, height - 82);
    ctx.lineTo(82, height - 82 - cut2);
    ctx.lineTo(82, 82 + cut2);
    ctx.closePath();
    ctx.stroke();

    // Corner crosshairs with digital telemetry stamps
    drawTechCrosshairCorner(ctx, 80, 80, accentColor);
    drawTechCrosshairCorner(ctx, width - 80, 80, accentColor);
    drawTechCrosshairCorner(ctx, 80, height - 80, accentColor);
    drawTechCrosshairCorner(ctx, width - 80, height - 80, accentColor);

    // Digital coordinates stamps
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('[TKTI_YANGIYER // SEC_2026]', 130, 86);
    ctx.fillText('[CERT_REGISTRY // VERIFIED]', width - 330, 86);
  } else if (layoutType === 'minimalist') {
    // ----------------------------------------------------
    // LAYOUT 7: SWISS MINIMALIST ASYMMETRICAL
    // ----------------------------------------------------
    // Architectural minimal hairline borders
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    // Thick left bar
    ctx.fillStyle = primaryColor;
    ctx.fillRect(50, 50, 16, height - 100);

    // Subtle blue accent rule at bottom
    ctx.fillStyle = accentColor;
    ctx.fillRect(50, height - 66, width - 100, 6);

    // Clean grid corner tick marks
    drawModernCornerNotch(ctx, 66, 66, primaryColor);
    drawModernCornerNotch(ctx, width - 66, 66, primaryColor);
  } else if (layoutType === 'baroque') {
    // ----------------------------------------------------
    // LAYOUT 8: BAROQUE LAUREL GARLAND & WREATHS
    // ----------------------------------------------------
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 18;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    ctx.strokeStyle = 'rgba(11, 31, 58, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(84, 84, width - 168, height - 168);

    // 4 Corner Handcrafted Baroque Laurel Wreaths
    drawBaroqueCornerWreath(ctx, 110, 110, secondaryColor);
    drawBaroqueCornerWreath(ctx, width - 110, 110, secondaryColor);
    drawBaroqueCornerWreath(ctx, 110, height - 110, secondaryColor);
    drawBaroqueCornerWreath(ctx, width - 110, height - 110, secondaryColor);
  } else if (layoutType === 'wax_seal') {
    // ----------------------------------------------------
    // LAYOUT 9: DIPLOMATIC TREATY & RED WAX SEAL
    // ----------------------------------------------------
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 20;
    ctx.strokeRect(58, 58, width - 116, height - 116);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(76, 76, width - 152, height - 152);

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(88, 88, width - 176, height - 176);

    drawDiplomaticCornerShield(ctx, 88, 88, primaryColor);
    drawDiplomaticCornerShield(ctx, width - 88, 88, primaryColor);
    drawDiplomaticCornerShield(ctx, 88, height - 88, primaryColor);
    drawDiplomaticCornerShield(ctx, width - 88, height - 88, primaryColor);
  } else {
    // ----------------------------------------------------
    // LAYOUT 10: CORPORATE SMART CARD GRID
    // ----------------------------------------------------
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 18;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(72, 72, width - 144, height - 144);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(85, 85, width - 170, height - 170);

    drawSapphireCornerConstellation(ctx, 85, 85, accentColor);
    drawSapphireCornerConstellation(ctx, width - 85, 85, accentColor);
    drawSapphireCornerConstellation(ctx, 85, height - 85, accentColor);
    drawSapphireCornerConstellation(ctx, width - 85, height - 85, accentColor);
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
  const { primaryColor, secondaryColor, accentColor, layoutType } = design;

  if (layoutType === 'wax_seal') {
    // ----------------------------------------------------
    // REALISTIC 3D RED WAX SEAL WITH HANGING SILK RIBBONS
    // ----------------------------------------------------
    // Hanging ribbons from behind the seal
    ctx.save();
    ctx.fillStyle = '#991b1b';
    // Left ribbon tail
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy);
    ctx.lineTo(cx - 55, cy + radius + 85);
    ctx.lineTo(cx - 30, cy + radius + 60);
    ctx.lineTo(cx - 5, cy + radius + 85);
    ctx.lineTo(cx - 10, cy);
    ctx.closePath();
    ctx.fill();
    // Right ribbon tail
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy);
    ctx.lineTo(cx + 5, cy + radius + 85);
    ctx.lineTo(cx + 30, cy + radius + 60);
    ctx.lineTo(cx + 55, cy + radius + 85);
    ctx.lineTo(cx + 40, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3D Embossed Wax Body with irregular organic scalloped edge
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;

    const waxGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, radius);
    waxGrad.addColorStop(0, '#ef4444');
    waxGrad.addColorStop(0.5, '#dc2626');
    waxGrad.addColorStop(0.85, '#991b1b');
    waxGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = waxGrad;

    ctx.beginPath();
    const points = 36;
    for (let i = 0; i < points; i++) {
      const angle = (i * Math.PI * 2) / points;
      const wobble = Math.sin(i * 3) * 5 + Math.cos(i * 5) * 3;
      const r = radius + wobble;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Deep embossed center ring
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Emblem in wax center: Uzbek Coat of Arms / 8-pointed star
    drawCenter8PointStar(ctx, cx, cy - 6, 26, '#fee2e2');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fee2e2';
    ctx.font = 'bold 13px "Times New Roman", Georgia, serif';
    ctx.fillText('TKTI YANGIYER', cx, cy + 32);
    ctx.restore();
    return;
  }

  // ----------------------------------------------------
  // STANDARD / IMPERIAL MEDALLIONS
  // ----------------------------------------------------
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  // Outer serrated circle
  ctx.fillStyle = secondaryColor;
  const teeth = layoutType === 'arch' || layoutType === 'decree' ? 32 : 48;
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

  // White highlight ring
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

  // Center Emblem
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (layoutType === 'cyber') {
    // Atom orbit
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
  } else if (layoutType === 'decree' || layoutType === 'arch') {
    // 8-pointed star
    drawCenter8PointStar(ctx, cx, cy - 8, 28, secondaryColor);
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

// ----------------- CORNER & EMBLEM HELPERS -----------------

function drawSidebarInstituteEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 65, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 55, 0, Math.PI * 2);
  ctx.stroke();

  drawCenter8PointStar(ctx, cx, cy, 32, color);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('TKTI', cx, cy + 95);
  ctx.restore();
}

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

function drawBaroqueCornerWreath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  goldColor: string
) {
  ctx.save();
  ctx.strokeStyle = goldColor;
  ctx.fillStyle = goldColor;
  ctx.lineWidth = 2;

  // Circular laurel garland branch
  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  ctx.stroke();

  // Laurel leaf pair stamps
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    const lx = cx + Math.cos(a) * 32;
    const ly = cy + Math.sin(a) * 32;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 7, 3, a, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center gold rosette dot
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
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
