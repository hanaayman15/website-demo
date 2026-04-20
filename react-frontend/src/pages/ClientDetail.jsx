import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { useClientDetail } from '../hooks/useClientDetail';
import AdminQuickNav from '../components/layout/AdminQuickNav';
import '../assets/styles/react-pages.css';

const PAGE_CSS = `
.detail-page {
  background-image: url('/images/pexels-jplenio-1103970.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  padding: 24px;
}
.detail-wrap {
  max-width: 1200px;
  margin: 0 auto;
}
.detail-nav {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid #dbe5ea;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.detail-nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.detail-back {
  border: 1px solid #d8dee6;
  background: #f7f9fc;
  color: #1b3b5f;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}
.detail-nav-title {
  color: #3b3b3b;
  font-size: 28px;
  font-weight: 700;
}
.detail-nav-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.detail-nav-link {
  text-decoration: none;
  border: 1px solid #d8dee6;
  background: #f0f2f6;
  color: #1b3b5f;
  border-radius: 14px;
  padding: 9px 14px;
  font-size: 14px;
  font-weight: 700;
}
.detail-card {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  border: 1px solid #d9e5e8;
  box-shadow: 0 12px 28px rgba(31, 64, 74, 0.15);
  padding: 28px;
}
.detail-profile-top {
  display: flex;
  align-items: center;
  gap: 26px;
  margin-bottom: 22px;
}
.detail-avatar {
  width: 108px;
  height: 108px;
  border-radius: 999px;
  background: #94c2e7;
  color: #1c2f44;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 800;
}
.detail-name {
  margin: 0;
  color: #224569;
  font-size: 42px;
  font-weight: 800;
}
.detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
}
.detail-stat {
  border: 1px solid #d9dee5;
  border-radius: 16px;
  background: #f7f8fb;
  padding: 16px;
}
.detail-stat-value {
  color: #4a97f5;
  font-weight: 800;
  font-size: 30px;
}
.detail-stat-label {
  color: #7b7b7b;
  font-size: 18px;
  font-weight: 700;
}
.detail-wrap .react-alert {
  font-size: 13px;
}
.detail-tabs-card {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  border: 1px solid #d9e5e8;
  box-shadow: 0 12px 28px rgba(31, 64, 74, 0.15);
  padding: 24px;
}
.detail-tabs {
  display: grid;
  grid-template-columns: repeat(7, minmax(130px, 1fr));
  gap: 8px;
  border-bottom: 1px solid #e4e6eb;
  padding-bottom: 10px;
  overflow-x: auto;
}
.detail-tab-btn {
  border: none;
  background: transparent;
  color: #888;
  font-size: 16px;
  font-weight: 700;
  padding: 8px 6px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.detail-tab-btn.active {
  color: #4a9ff5;
  border-bottom-color: #4a9ff5;
}
.detail-section {
  padding-top: 18px;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 18px;
}
.detail-item-label {
  color: #888;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}
.detail-item-value {
  color: #333;
  font-size: 16px;
  font-weight: 600;
}
.detail-edit-btn {
  border: 1px solid #d8dee6;
  background: #f7f9fc;
  color: #1b3b5f;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
}
.detail-floating-programs-edit {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1200;
  box-shadow: 0 12px 26px rgba(22, 45, 70, 0.28);
}
.detail-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 18, 28, 0.55);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}
.detail-modal {
  width: min(520px, 100%);
  background: rgba(255, 255, 255, 0.98);
  border-radius: 18px;
  border: 1px solid #d9e5e8;
  box-shadow: 0 16px 40px rgba(20, 48, 64, 0.24);
  padding: 20px;
  display: grid;
  gap: 12px;
}
.detail-modal-title {
  margin: 0;
  color: #234d72;
  font-size: 24px;
  font-weight: 800;
}
.detail-modal-subtitle {
  margin: 0;
  color: #5c6f84;
  font-size: 14px;
}
.detail-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}
@media (max-width: 980px) {
  .detail-name {
    font-size: 34px;
  }
  .detail-stat-value {
    font-size: 28px;
  }
  .detail-stat-label {
    font-size: 16px;
  }
  .detail-tab-btn {
    font-size: 13px;
    min-width: 120px;
  }
  .detail-floating-programs-edit {
    right: 10px;
    bottom: 10px;
  }
}
`;

const CLIENT_PDF_BACKGROUND_IMAGE = '/images/pdf-bg-custom.png?v=20260405c';

function toPlainText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function limitClientNameWords(name, maxWords = 3) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'Client';
  return words.slice(0, maxWords).join(' ');
}

function chunksOfTwo(items) {
  const list = Array.isArray(items) ? items : [];
  const chunks = [];
  for (let i = 0; i < list.length; i += 2) {
    chunks.push(list.slice(i, i + 2));
  }
  return chunks;
}

const EN_DAY_TO_AR = {
  Sunday: 'الأحد',
  Monday: 'الاثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت',
};

function normalizePdfMeals(meals) {
  const list = Array.isArray(meals) ? meals : [];
  return list.map((meal, index) => ({
    mealLabel: toPlainText(meal?.type, `Meal ${index + 1}`),
    time: toPlainText(meal?.time, 'N/A'),
    notes: toPlainText(meal?.notes, ''),
    descriptionEn: toPlainText(meal?.en || meal?.description_en || meal?.description || meal?.name || meal?.meal, 'N/A'),
    descriptionAr: toPlainText(meal?.ar || meal?.description_ar, 'N/A'),
  }));
}

function localizedDayName(day, language) {
  const english = toPlainText(day, language === 'arabic' ? 'اليوم' : 'Day');
  if (language !== 'arabic') return english;
  return EN_DAY_TO_AR[english] || english;
}

function resolveMealDescription(meal, language) {
  const rawDescription = language === 'arabic'
    ? meal.descriptionAr
    : meal.descriptionEn;
  return rawDescription === 'N/A'
    ? (language === 'arabic' ? meal.descriptionEn : rawDescription)
    : rawDescription;
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${line} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

function getMealBlockMetrics(ctx, { language, meal, width, maxLines = 6 }) {
  const description = resolveMealDescription(meal, language);
  ctx.font = language === 'arabic' ? '17px "Segoe UI", "Tahoma", sans-serif' : '17px "Segoe UI", sans-serif';
  const wrappedDescription = wrapCanvasText(ctx, description, width - 52);
  const linesToDraw = wrappedDescription.slice(0, Math.max(1, Math.min(maxLines, wrappedDescription.length)));
  const lineHeight = 18;
  const blockHeight = Math.max(72, 54 + (linesToDraw.length * lineHeight));
  return { linesToDraw, lineHeight, blockHeight };
}

function getTextCardMetrics(ctx, { language, text, width, maxLines = 18 }) {
  const normalized = String(text ?? '').trim();
  if (!normalized) {
    return { linesToDraw: [], lineHeight: 26, cardHeight: 0 };
  }

  ctx.font = language === 'arabic' ? '23px "Segoe UI", "Tahoma", sans-serif' : '23px "Segoe UI", sans-serif';
  const wrapped = wrapCanvasText(ctx, normalized, width - 44);
  const linesToDraw = wrapped.slice(0, Math.max(1, Math.min(maxLines, wrapped.length)));
  const lineHeight = 26;
  const cardHeight = Math.max(132, 92 + (linesToDraw.length * lineHeight));
  return { linesToDraw, lineHeight, cardHeight };
}

function calculateMealsCardHeight(ctx, { language, meals, width }) {
  const orderedMeals = normalizePdfMeals(meals);
  if (!orderedMeals.length) return 128;

  const blockGap = 2;
  let totalHeight = 92;
  orderedMeals.forEach((meal, index) => {
    const { blockHeight } = getMealBlockMetrics(ctx, { language, meal, width });
    totalHeight += blockHeight;
    if (index < orderedMeals.length - 1) {
      totalHeight += blockGap;
    }
  });

  return Math.max(128, Math.min(760, totalHeight));
}

async function tryLoadBackgroundImage() {
  try {
    const response = await fetch(CLIENT_PDF_BACKGROUND_IMAGE, { cache: 'no-cache' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);
    return img;
  } catch {
    return null;
  }
}

function drawTransparentCard(ctx, x, y, width, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.strokeStyle = 'rgba(0,0,0,0.98)';
  ctx.lineWidth = 2;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 16);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  }
  ctx.restore();
}

function setupPageCanvas(backgroundImage) {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');

  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#1b3b5f');
    g.addColorStop(1, '#4a97f5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return { canvas, ctx };
}

async function canvasToPngBytes(canvas) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return await blob.arrayBuffer();
}

function drawPageHeader(ctx, { language, clientName }) {
  const title = language === 'arabic' ? 'نظام غذائي' : 'Nutrition Plan';
  const displayName = limitClientNameWords(clientName, 3);

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.98)';
  ctx.font = language === 'arabic' ? 'bold 56px "Segoe UI", "Tahoma", sans-serif' : 'bold 56px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 620, 96);

  ctx.font = language === 'arabic' ? 'bold 42px "Segoe UI", "Tahoma", sans-serif' : 'bold 42px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.98)';
  ctx.fillText(toPlainText(displayName, language === 'arabic' ? 'العميل' : 'Client'), 620, 152);
  ctx.restore();
}

function drawMealsCard(ctx, { language, day, meals, x, y, width, height, competitionEnabled }) {
  drawTransparentCard(ctx, x, y, width, height);

  const dayTitle = language === 'arabic'
    ? localizedDayName(day, language)
    : toPlainText(day, 'Day');
  const orderedMeals = normalizePdfMeals(meals);

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.98)';
  ctx.font = language === 'arabic' ? 'bold 28px "Segoe UI", "Tahoma", sans-serif' : 'bold 28px "Segoe UI", sans-serif';
  ctx.textAlign = language === 'arabic' ? 'right' : 'left';
  ctx.direction = language === 'arabic' ? 'rtl' : 'ltr';
  ctx.fillText(dayTitle, language === 'arabic' ? x + width - 24 : x + 24, y + 38);

  let cursorY = y + 72;
  const cardBottom = y + height - 16;
  const blockGap = 2;

  if (!orderedMeals.length) {
    ctx.font = language === 'arabic' ? '22px "Segoe UI", "Tahoma", sans-serif' : '22px "Segoe UI", sans-serif';
    const emptyLabel = language === 'arabic' ? 'لا توجد وجبات لهذا اليوم.' : 'No meals added for this day.';
    ctx.fillText(emptyLabel, language === 'arabic' ? x + width - 24 : x + 24, cursorY + 26);
    ctx.restore();
    return;
  }

  for (let mealIndex = 0; mealIndex < orderedMeals.length; mealIndex += 1) {
    const meal = orderedMeals[mealIndex];
    const remainingHeight = cardBottom - cursorY;
    if (remainingHeight <= 42) break;

    const maxLinesByRemaining = Math.max(1, Math.floor((remainingHeight - 56) / 18));
    const { linesToDraw, lineHeight, blockHeight: preferredBlockHeight } = getMealBlockMetrics(ctx, {
      language,
      meal,
      width,
      maxLines: maxLinesByRemaining,
    });
    const blockHeight = Math.min(preferredBlockHeight, remainingHeight);
    const blockTop = cursorY;
    const labelY = blockTop;
    const timeY = blockTop + 20;
    const descStartY = blockTop + 38;

    ctx.font = language === 'arabic' ? 'bold 22px "Segoe UI", "Tahoma", sans-serif' : 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText(meal.mealLabel, language === 'arabic' ? x + width - 24 : x + 24, labelY);

    // Show notes instead of time when Competition Enabled
    const displayValue = competitionEnabled && meal.notes ? meal.notes : meal.time;
    // Keep numerals/time visually stable even on RTL pages.
    ctx.direction = 'ltr';
    ctx.textAlign = language === 'arabic' ? 'right' : 'left';
    ctx.font = '20px "Segoe UI", "Tahoma", sans-serif';
    ctx.fillText(displayValue, language === 'arabic' ? x + width - 24 : x + 24, timeY);
    ctx.direction = language === 'arabic' ? 'rtl' : 'ltr';

    ctx.font = language === 'arabic' ? '17px "Segoe UI", "Tahoma", sans-serif' : '17px "Segoe UI", sans-serif';
    linesToDraw.forEach((line, lineIndex) => {
      const lineY = descStartY + (lineIndex * lineHeight);
      if (lineY > blockTop + blockHeight - 6) return;
      ctx.fillText(line, language === 'arabic' ? x + width - 24 : x + 24, lineY);
    });

    cursorY += blockHeight;
    if (mealIndex < orderedMeals.length - 1) {
      cursorY += blockGap;
    }
  }

  ctx.restore();
}

function drawTextCard(ctx, { language, title, text, x, y, width, height }) {
  drawTransparentCard(ctx, x, y, width, height);

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.98)';
  ctx.font = language === 'arabic' ? 'bold 28px "Segoe UI", "Tahoma", sans-serif' : 'bold 28px "Segoe UI", sans-serif';
  ctx.fillText(title, x + 24, y + 42);

  const { linesToDraw } = getTextCardMetrics(ctx, { language, text, width });
  ctx.font = language === 'arabic' ? '23px "Segoe UI", "Tahoma", sans-serif' : '23px "Segoe UI", sans-serif';
  let cursorY = y + 76;
  linesToDraw.forEach((line) => {
    if (cursorY > y + height - 16) return;
    ctx.fillText(line, x + 24, cursorY);
    cursorY += 26;
  });
  ctx.restore();
}

async function generateClientProgramsPdf({ clientName, language, weekDays, dayMealsMap, programFields, competitionEnabled }) {
  const backgroundImage = await tryLoadBackgroundImage();
  const pdfDoc = await PDFDocument.create();

  const labels = language === 'arabic'
    ? {
        title: 'الخطة الغذائية',
        weeklyPlan: 'الخطة الأسبوعية',
        notes: 'الملاحظات',
        supplements: 'المكملات',
        mental: 'الملاحظات الذهنية',
        noMeals: 'لا توجد وجبات لهذا اليوم.',
        noValue: 'لا يوجد بيانات.',
      }
    : {
        title: 'Nutrition Plan',
        weeklyPlan: 'Weekly Meal Plan',
        notes: 'Notes',
        supplements: 'Supplements',
        mental: 'Mental Observations',
        noMeals: 'No meals added for this day.',
        noValue: 'No data.',
      };

  const allDays = Array.isArray(weekDays) && weekDays.length
    ? weekDays
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const pagesDays = chunksOfTwo(allDays);

  for (const dayChunk of pagesDays) {
    const { canvas, ctx } = setupPageCanvas(backgroundImage);
    drawPageHeader(ctx, { language, clientName });

    const cardWidth = canvas.width - 144;

    let currentY = 299;
    dayChunk.forEach((day, idx) => {
      const meals = dayMealsMap?.[day] || [];
      const preferredHeight = calculateMealsCardHeight(ctx, {
        language,
        meals,
        width: cardWidth,
      });
      const availableHeight = canvas.height - currentY - 72;
      const cardHeight = Math.max(128, Math.min(preferredHeight, availableHeight));

      drawMealsCard(ctx, {
        language,
        day,
        meals,
        x: 72,
        y: currentY,
        width: cardWidth,
        height: cardHeight,
        competitionEnabled,
      });

      if (idx < dayChunk.length - 1) {
        currentY += cardHeight + 16;
      }
    });

    const pngBytes = await canvasToPngBytes(canvas);
    const png = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawImage(png, { x: 0, y: 0, width: 595.28, height: 841.89 });
  }

  const { canvas: lastCanvas, ctx: lastCtx } = setupPageCanvas(backgroundImage);
  drawPageHeader(lastCtx, { language, clientName });

  const sectionTitles = language === 'arabic'
    ? { notes: 'الملاحظات', supplements: 'المكملات', mental: 'الملاحظات الذهنية' }
    : { notes: 'Notes', supplements: 'Supplements', mental: 'Mental Observations' };

  const sections = [
    { title: sectionTitles.notes, text: String(programFields?.notesText ?? '').trim() },
    { title: sectionTitles.supplements, text: String(programFields?.supplementsText ?? '').trim() },
    { title: sectionTitles.mental, text: String(programFields?.mentalText ?? '').trim() },
  ].filter((section) => section.text.length > 0);

  const startY = 292;
  const gap = 14;
  const cardWidth = lastCanvas.width - 144;
  let currentY = startY;

  sections.forEach((section) => {
    const availableHeight = lastCanvas.height - currentY - 40;
    if (availableHeight <= 0) return;

    const maxLinesByAvailable = Math.max(1, Math.floor((availableHeight - 108) / 26));
    const { cardHeight } = getTextCardMetrics(lastCtx, {
      language,
      text: section.text,
      width: cardWidth,
      maxLines: maxLinesByAvailable,
    });

    if (cardHeight > 0 && currentY + cardHeight <= lastCanvas.height - 40) {
      drawTextCard(lastCtx, {
        language,
        title: section.title,
        text: section.text,
        x: 72,
        y: currentY,
        width: cardWidth,
        height: Math.max(132, cardHeight),
      });
      currentY += Math.max(132, cardHeight) + gap;
    }
  });

  const lastPngBytes = await canvasToPngBytes(lastCanvas);
  const lastPng = await pdfDoc.embedPng(lastPngBytes);
  const finalPage = pdfDoc.addPage([595.28, 841.89]);
  finalPage.drawImage(lastPng, { x: 0, y: 0, width: 595.28, height: 841.89 });

  return pdfDoc.save();
}

function toValue(client, keys, fallback = 'N/A') {
  for (const key of keys) {
    const value = client?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return fallback;
}

function computeAge(birthday) {
  if (!birthday) return 'N/A';
  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return Number.isFinite(age) && age >= 0 ? `${age} years` : 'N/A';
}

function initialsFromName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function buildDetailForm(client) {
  return {
    birthday: toValue(client, ['birthday'], ''),
    gender: toValue(client, ['gender'], ''),
    club: toValue(client, ['club'], ''),
    country: toValue(client, ['country'], ''),
    religion: toValue(client, ['religion'], ''),
    wake_up_time: toValue(client, ['wake_up_time', 'wakeUpTime'], ''),
    sleep_time: toValue(client, ['sleep_time', 'sleepTime'], ''),
    height: toValue(client, ['height'], ''),
    weight: toValue(client, ['weight'], ''),
    bmi: toValue(client, ['bmi'], ''),
    bmr: toValue(client, ['bmr'], ''),
    tdee: toValue(client, ['tdee'], ''),
    activity_level: toValue(client, ['activity_level', 'activityLevel'], ''),
    sport: toValue(client, ['sport'], ''),
    position: toValue(client, ['position'], ''),
    calories: toValue(client, ['calories'], ''),
    body_fat_percentage: toValue(client, ['body_fat_percentage', 'bodyFat'], ''),
    skeletal_muscle: toValue(client, ['skeletal_muscle', 'muscleMass'], ''),
    water_in_body: toValue(client, ['water_in_body', 'waterInBody'], ''),
    minerals: toValue(client, ['minerals'], ''),
    goal_weight: toValue(client, ['goal_weight', 'goalWeight'], ''),
    progression_type: toValue(client, ['progression_type', 'progressionType'], ''),
    competition_date: toValue(client, ['competition_date', 'competitionDate'], ''),
    injuries: toValue(client, ['injuries'], ''),
    food_allergies: toValue(client, ['food_allergies', 'foodAllergies'], ''),
    mental_observation: toValue(client, ['mental_observation', 'mental_notes', 'mentalObservation'], ''),
    medical_notes: toValue(client, ['medical_notes', 'medicalNotes'], ''),
  };
}

function ClientDetail() {
  const [searchParams] = useSearchParams();
  const {
    selectedClientId,
    loading,
    saving,
    error,
    message,
    client,
    weekDays,
    selectedDay,
    setSelectedDay,
    programsState,
    isAdminUser,
    canEditDietPlanSelection,
    canEditDietPlanNames,
    canEditAdminPersonalNotes,
    selectedDietScheduleType,
    dietPlansWithSummary,
    competitionEnabled,
    visibleDayMeals,
    updateNotes,
    updateProgramField,
    applyDietPlan,
    updateDietPlanName,
    saveDietPlanNames,
    resetDietPlanNames,
    addMeal,
    updateMeal,
    moveMealUp,
    moveMealDown,
    deleteMeal,
    saveNotes,
    saveDetailFields,
  } = useClientDetail();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingPrograms, setIsEditingPrograms] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfLanguage, setPdfLanguage] = useState('english');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const hasAutoGeneratedPdf = useRef(false);
  const [selectedPlanDraft, setSelectedPlanDraft] = useState(null);
  const [detailForm, setDetailForm] = useState(() => buildDetailForm());

  useEffect(() => {
    setDetailForm(buildDetailForm(client));
  }, [client]);

  useEffect(() => {
    setSelectedPlanDraft(programsState.selectedPlanIndex);
  }, [programsState.selectedPlanIndex]);

  const updateDetailForm = (field, value) => {
    setDetailForm((prev) => ({ ...prev, [field]: value }));
  };

  const canEditDetails = isAdminUser && isEditingDetails;

  const startDetailsEdit = () => {
    if (isAdminUser) setIsEditingDetails(true);
  };

  const cancelDetailsEdit = () => {
    setIsEditingDetails(false);
    setDetailForm(buildDetailForm(client));
  };

  const saveEditedDetails = async () => {
    const ok = await saveDetailFields(detailForm);
    if (ok) setIsEditingDetails(false);
  };

  const dayMeals = visibleDayMeals[selectedDay] || [];
  const clientName = toValue(client, ['name', 'full_name'], 'Client');
  const tabs = useMemo(() => ([
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'metabolism', label: 'Metabolism & Activity', icon: '💪' },
    { id: 'nutrition', label: 'Nutrition Plan', icon: '🍽️' },
    { id: 'health', label: 'Health & Observations', icon: '💉' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'measurements', label: 'Measurements', icon: '📊' },
    { id: 'programs', label: 'Programs', icon: '🗓️' },
  ]), []);

  const openPdfModal = () => {
    setPdfError('');
    setPdfLanguage('english');
    setPdfModalOpen(true);
  };

  const closePdfModal = () => {
    if (generatingPdf) return;
    setPdfModalOpen(false);
  };

  const downloadGeneratedPdf = (bytes, language) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = String(clientName || 'client').replace(/\s+/g, '_').toLowerCase();
    const suffix = language === 'arabic' ? 'ar' : 'en';
    link.href = url;
    link.download = `${safeName}_nutrition_plan_${suffix}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGeneratePdf = async (languageOverride) => {
    const languageToUse = languageOverride === 'arabic' ? 'arabic' : (languageOverride === 'english' ? 'english' : pdfLanguage);
    setPdfError('');
    setGeneratingPdf(true);
    try {
      await saveNotes();
      const bytes = await generateClientProgramsPdf({
        clientName,
        language: languageToUse,
        weekDays,
        dayMealsMap: visibleDayMeals,
        programFields: programsState.programFields,
        competitionEnabled,
      });
      downloadGeneratedPdf(bytes, languageToUse);
      setPdfModalOpen(false);
    } catch (err) {
      setPdfError(err?.message || 'Failed to generate client PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    const autoGenerate = searchParams.get('auto_generate_pdf') === '1';
    if (!autoGenerate) return;
    if (hasAutoGeneratedPdf.current) return;
    if (loading || !selectedClientId || generatingPdf) return;

    const requestedLanguage = searchParams.get('pdf_language') === 'arabic' ? 'arabic' : 'english';
    hasAutoGeneratedPdf.current = true;
    setPdfLanguage(requestedLanguage);
    handleGeneratePdf(requestedLanguage);
  }, [searchParams, loading, selectedClientId, generatingPdf]);

  if (loading) {
    return <main className="react-page-wrap">Loading client details...</main>;
  }

  return (
    <main className="detail-page">
      <style>{PAGE_CSS}</style>
      <div className="detail-wrap">
        <AdminQuickNav title="Client Details" />
        <section className="detail-nav">
          <div className="detail-nav-left">
            <h1 className="detail-nav-title">{clientName}</h1>
          </div>
          <div className="detail-nav-actions">
            <button className="detail-nav-link" type="button" onClick={openPdfModal}>Generate PDF</button>
          </div>
        </section>

        {pdfModalOpen ? (
          <div className="detail-modal-overlay" role="dialog" aria-modal="true" aria-label="Generate client PDF">
            <section className="detail-modal">
              <h2 className="detail-modal-title">Generate Client PDF</h2>
              <p className="detail-modal-subtitle">Choose PDF language, then generate the client nutrition plan document.</p>
              <label>
                <span className="react-label">Language</span>
                <select
                  className="react-input"
                  value={pdfLanguage}
                  onChange={(event) => setPdfLanguage(event.target.value)}
                  disabled={generatingPdf}
                >
                  <option value="english">English</option>
                  <option value="arabic">Arabic</option>
                </select>
              </label>
              {pdfError ? <div className="react-alert react-alert-error" style={{ margin: 0 }}>{pdfError}</div> : null}
              <div className="detail-modal-actions">
                <button className="react-btn react-btn-ghost" type="button" onClick={closePdfModal} disabled={generatingPdf}>Cancel</button>
                <button className="react-btn" type="button" onClick={handleGeneratePdf} disabled={generatingPdf}>
                  {generatingPdf ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {error ? <div className="react-alert react-alert-error" style={{ marginTop: 16 }}>{error}</div> : null}
        {message ? <div className="react-alert react-alert-success" style={{ marginTop: 16 }}>{message}</div> : null}

        <section className="detail-card">
          <div className="detail-profile-top">
            <div className="detail-avatar">{initialsFromName(clientName)}</div>
            <h2 className="detail-name">{clientName}</h2>
          </div>
          <div className="detail-stats">
            <article className="detail-stat">
              <div className="detail-stat-value">{toValue(client, ['weight'], 'N/A')}</div>
              <div className="detail-stat-label">Weight</div>
            </article>
            <article className="detail-stat">
              <div className="detail-stat-value">{toValue(client, ['height'], 'N/A')}</div>
              <div className="detail-stat-label">Height</div>
            </article>
            <article className="detail-stat">
              <div className="detail-stat-value">{String(toValue(client, ['age'], computeAge(toValue(client, ['birthday'], '')))).replace(' years', '')}</div>
              <div className="detail-stat-label">Age</div>
            </article>
            <article className="detail-stat">
              <div className="detail-stat-value">{toValue(client, ['gender'], 'N/A')}</div>
              <div className="detail-stat-label">Gender</div>
            </article>
          </div>
        </section>

        <section className="detail-tabs-card">
          <div className="detail-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`detail-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div>{tab.icon}</div>
                <div>{tab.label}</div>
              </button>
            ))}
          </div>

          {(activeTab === 'personal' || activeTab === 'metabolism' || activeTab === 'measurements' || activeTab === 'goals' || activeTab === 'health') ? (
            <div className="react-inline-actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              {isAdminUser ? (
                !isEditingDetails ? (
                  <button className="react-btn react-btn-ghost" type="button" onClick={startDetailsEdit}>Edit Details</button>
                ) : (
                  <>
                    <button className="react-btn react-btn-ghost" type="button" onClick={cancelDetailsEdit}>Cancel</button>
                    <button className="react-btn" type="button" onClick={saveEditedDetails} disabled={saving}>{saving ? 'Saving...' : 'Save Details'}</button>
                  </>
                )
              ) : (
                <span className="react-muted" style={{ fontSize: '14px' }}>Admin only - View only</span>
              )}
            </div>
          ) : null}

          {activeTab === 'personal' ? (
            <div className="detail-section">
              <div className="detail-grid">
                <div>
                  <div className="detail-item-label">Birthday</div>
                  {canEditDetails ? (
                    <input className="react-input" value={detailForm.birthday} onChange={(event) => updateDetailForm('birthday', event.target.value)} placeholder="YYYY-MM-DD" />
                  ) : <div className="detail-item-value">{toValue(client, ['birthday'], 'N/A')}</div>}
                </div>
                <div><div className="detail-item-label">Age</div><div className="detail-item-value">{toValue(client, ['age'], computeAge(toValue(client, ['birthday'], '')))}</div></div>
                <div>
                  <div className="detail-item-label">Gender</div>
                  {canEditDetails ? (
                    <input className="react-input" value={detailForm.gender} onChange={(event) => updateDetailForm('gender', event.target.value)} />
                  ) : <div className="detail-item-value">{toValue(client, ['gender'], 'N/A')}</div>}
                </div>
                <div>
                  <div className="detail-item-label">Club</div>
                  {canEditDetails ? (
                    <input className="react-input" value={detailForm.club} onChange={(event) => updateDetailForm('club', event.target.value)} />
                  ) : <div className="detail-item-value">{toValue(client, ['club'], 'N/A')}</div>}
                </div>
                <div>
                  <div className="detail-item-label">Country</div>
                  {canEditDetails ? (
                    <input className="react-input" value={detailForm.country} onChange={(event) => updateDetailForm('country', event.target.value)} />
                  ) : <div className="detail-item-value">{toValue(client, ['country'], 'N/A')}</div>}
                </div>
                <div>
                  <div className="detail-item-label">Religion</div>
                  {canEditDetails ? (
                    <input className="react-input" value={detailForm.religion} onChange={(event) => updateDetailForm('religion', event.target.value)} />
                  ) : <div className="detail-item-value">{toValue(client, ['religion'], 'N/A')}</div>}
                </div>
                <div>
                  <div className="detail-item-label">Average Wake-up Time</div>
                  {canEditDetails ? (
                    <input className="react-input" type="time" value={detailForm.wake_up_time} onChange={(event) => updateDetailForm('wake_up_time', event.target.value)} />
                  ) : <div className="detail-item-value">{toValue(client, ['wake_up_time', 'wakeUpTime'], 'N/A')}</div>}
                </div>
                <div>
                  <div className="detail-item-label">Average Sleep Time</div>
                  {canEditDetails ? (
                    <input className="react-input" type="time" value={detailForm.sleep_time} onChange={(event) => updateDetailForm('sleep_time', event.target.value)} />
                  ) : <div className="detail-item-value">{toValue(client, ['sleep_time', 'sleepTime'], 'N/A')}</div>}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'metabolism' ? (
            <div className="detail-section detail-grid">
              <div><div className="detail-item-label">BMI</div>{isEditingDetails ? <input className="react-input" value={detailForm.bmi} onChange={(event) => updateDetailForm('bmi', event.target.value)} /> : <div className="detail-item-value">{toValue(client, ['bmi'], 'N/A')}</div>}</div>
              <div><div className="detail-item-label">BMR</div>{isEditingDetails ? <input className="react-input" value={detailForm.bmr} onChange={(event) => updateDetailForm('bmr', event.target.value)} /> : <div className="detail-item-value">{toValue(client, ['bmr'], 'N/A')}</div>}</div>
              <div><div className="detail-item-label">TDEE</div>{isEditingDetails ? <input className="react-input" value={detailForm.tdee} onChange={(event) => updateDetailForm('tdee', event.target.value)} /> : <div className="detail-item-value">{toValue(client, ['tdee'], 'N/A')}</div>}</div>
              <div><div className="detail-item-label">Activity Level</div>{isEditingDetails ? <input className="react-input" value={detailForm.activity_level} onChange={(event) => updateDetailForm('activity_level', event.target.value)} /> : <div className="detail-item-value">{toValue(client, ['activity_level', 'activityLevel'], 'N/A')}</div>}</div>
              <div><div className="detail-item-label">Sport</div>{isEditingDetails ? <input className="react-input" value={detailForm.sport} onChange={(event) => updateDetailForm('sport', event.target.value)} /> : <div className="detail-item-value">{toValue(client, ['sport'], 'N/A')}</div>}</div>
              <div><div className="detail-item-label">Position</div>{isEditingDetails ? <input className="react-input" value={detailForm.position} onChange={(event) => updateDetailForm('position', event.target.value)} /> : <div className="detail-item-value">{toValue(client, ['position'], 'N/A')}</div>}</div>
            </div>
          ) : null}

          {activeTab === 'nutrition' ? (
            <div className="detail-section react-grid" style={{ gap: 12 }}>
              <div className="react-day-tabs">
                {weekDays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`react-day-tab ${day === selectedDay ? 'active' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {!dayMeals.length ? <p className="react-muted" style={{ margin: 0 }}>No meals added for {selectedDay}.</p> : null}
              {dayMeals.map((meal) => (
                <article key={meal.id} className="react-meal-card">
                  <div className="react-row-between">
                    <strong>{meal.type || 'Meal'}</strong>
                    <span className="react-muted">
                      {competitionEnabled && meal.notes ? meal.notes : (!competitionEnabled ? (meal.time || 'N/A') : 'N/A')}
                    </span>
                  </div>
                  <div>{meal.en || 'No english description'}</div>
                  <div style={{ direction: 'rtl' }}>{meal.ar || 'لا يوجد وصف عربي'}</div>
                </article>
              ))}
            </div>
          ) : null}

          {activeTab === 'health' ? (
            <div className="detail-section detail-grid">
              <div>
                <div className="detail-item-label">Injuries</div>
                {isEditingDetails ? (
                  <textarea className="react-textarea" rows={3} value={detailForm.injuries} onChange={(event) => updateDetailForm('injuries', event.target.value)} />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['injuries'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Medical Notes</div>
                {isEditingDetails ? (
                  <textarea
                    className="react-textarea"
                    rows={3}
                    value={detailForm.medical_notes}
                    onChange={(event) => updateDetailForm('medical_notes', event.target.value)}
                  />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['medical_notes', 'medicalNotes'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Food Allergies</div>
                {isEditingDetails ? (
                  <textarea className="react-textarea" rows={3} value={detailForm.food_allergies} onChange={(event) => updateDetailForm('food_allergies', event.target.value)} />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['food_allergies', 'foodAllergies'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Mental Observation</div>
                {isEditingDetails ? (
                  <textarea className="react-textarea" rows={3} value={detailForm.mental_observation} onChange={(event) => updateDetailForm('mental_observation', event.target.value)} />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['mental_observation', 'mental_notes', 'mentalObservation'], programsState.programFields.mentalText || 'N/A')}</div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'goals' ? (
            <div className="detail-section detail-grid">
              <div>
                <div className="detail-item-label">Goal Weight</div>
                {isEditingDetails ? (
                  <input
                    className="react-input"
                    value={detailForm.goal_weight}
                    onChange={(event) => updateDetailForm('goal_weight', event.target.value)}
                  />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['goal_weight', 'goalWeight'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Progression Type</div>
                {isEditingDetails ? (
                  <input
                    className="react-input"
                    value={detailForm.progression_type}
                    onChange={(event) => updateDetailForm('progression_type', event.target.value)}
                    placeholder="maintain / cut / bulk"
                  />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['progression_type', 'progressionType'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Calories Target</div>
                {isEditingDetails ? (
                  <input className="react-input" value={detailForm.calories} onChange={(event) => updateDetailForm('calories', event.target.value)} />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['calories'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Competition Date</div>
                {isEditingDetails ? (
                  <input
                    className="react-input"
                    type="date"
                    value={detailForm.competition_date}
                    onChange={(event) => updateDetailForm('competition_date', event.target.value)}
                  />
                ) : (
                  <div className="detail-item-value">
                    {toValue(client, ['competition_status', 'competitionStatus'], '') === 'none'
                      ? 'none'
                      : (toValue(client, ['competition_date', 'competitionDate'], '') || 'N/A')}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'measurements' ? (
            <div className="detail-section detail-grid">
              <div><div className="detail-item-label">Weight</div>{isEditingDetails ? <input className="react-input" value={detailForm.weight} onChange={(event) => updateDetailForm('weight', event.target.value)} /> : <div className="detail-item-value">{toValue(client, ['weight'], 'N/A')}</div>}</div>
              <div><div className="detail-item-label">Height</div>{isEditingDetails ? <input className="react-input" value={detailForm.height} onChange={(event) => updateDetailForm('height', event.target.value)} /> : <div className="detail-item-value">{toValue(client, ['height'], 'N/A')}</div>}</div>
              <div>
                <div className="detail-item-label">Body Fat %</div>
                {isEditingDetails ? (
                  <input
                    className="react-input"
                    value={detailForm.body_fat_percentage}
                    onChange={(event) => updateDetailForm('body_fat_percentage', event.target.value)}
                  />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['body_fat_percentage', 'bodyFat'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Skeletal Muscle</div>
                {isEditingDetails ? (
                  <input
                    className="react-input"
                    value={detailForm.skeletal_muscle}
                    onChange={(event) => updateDetailForm('skeletal_muscle', event.target.value)}
                  />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['skeletal_muscle', 'muscleMass'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Water In Body</div>
                {isEditingDetails ? (
                  <input
                    className="react-input"
                    value={detailForm.water_in_body}
                    onChange={(event) => updateDetailForm('water_in_body', event.target.value)}
                  />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['water_in_body', 'waterInBody'], 'N/A')}</div>
                )}
              </div>
              <div>
                <div className="detail-item-label">Minerals</div>
                {isEditingDetails ? (
                  <input
                    className="react-input"
                    value={detailForm.minerals}
                    onChange={(event) => updateDetailForm('minerals', event.target.value)}
                  />
                ) : (
                  <div className="detail-item-value">{toValue(client, ['minerals'], 'N/A')}</div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'programs' ? (
            <div className="detail-section react-grid" style={{ gap: 14 }}>
              <form onSubmit={saveNotes} className="react-grid" style={{ gap: 10 }}>
                <section className="react-panel react-grid" style={{ gap: 10 }}>
                  <h3 style={{ margin: 0 }}>Select Diet Plan</h3>
                  <p className="react-muted" style={{ margin: 0 }}>
                    Schedule Type: {selectedDietScheduleType === 'school' ? 'School' : 'Summer'}
                  </p>
                  {!canEditDietPlanSelection ? (
                    <p className="react-muted" style={{ margin: 0 }}>
                      Diet plan selection is auto-assigned from TDEE and schedule type. Only admin can manually change it.
                    </p>
                  ) : null}
                  <div className="react-grid" style={{ gap: 10 }}>
                    {dietPlansWithSummary.map((entry) => {
                      const isSelected = selectedPlanDraft === entry.index;
                      return (
                        <div key={`diet-plan-${entry.index}`} className="react-grid" style={{ gap: 8 }}>
                          <button
                            type="button"
                            className={isSelected ? 'react-btn' : 'react-btn react-btn-ghost'}
                            style={{ justifyContent: 'space-between', textAlign: 'left' }}
                            onClick={() => {
                              if (!canEditDietPlanSelection) return;
                              setSelectedPlanDraft(entry.index);
                            }}
                            disabled={!canEditDietPlanSelection}
                          >
                            <span>{`${entry.min}-${entry.max} kcal | ${entry.dietType} | ${entry.mealsCount} meals`}</span>
                            <span>{`${entry.min} Min / ${entry.max} Max`}</span>
                          </button>
                          {canEditDietPlanNames ? (
                            <label className="react-grid" style={{ gap: 6 }}>
                              <span className="react-label" style={{ margin: 0 }}>Plan Name</span>
                              <input
                                className="react-input"
                                value={entry.dietType}
                                onChange={(event) => updateDietPlanName(entry.index, event.target.value)}
                                disabled={!isEditingPrograms}
                                placeholder={`Plan ${entry.index + 1}`}
                              />
                            </label>
                          ) : null}
                        </div>
                      );
                    })}
                    {!dietPlansWithSummary.length ? <p className="react-muted" style={{ margin: 0 }}>No saved plans found in Diet Management.</p> : null}
                  </div>
                  <div className="react-inline-actions" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="react-btn"
                      type="button"
                      disabled={!canEditDietPlanSelection}
                      onClick={() => {
                        if (!canEditDietPlanSelection) return;
                        if (canEditDietPlanNames && isEditingPrograms) {
                          saveDietPlanNames();
                        }
                        if (selectedPlanDraft !== null && selectedPlanDraft !== undefined) {
                          applyDietPlan(selectedPlanDraft);
                        }
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="react-btn react-btn-ghost"
                      type="button"
                      onClick={() => {
                        if (canEditDietPlanNames && isEditingPrograms) {
                          resetDietPlanNames();
                        }
                        setSelectedPlanDraft(programsState.selectedPlanIndex);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </section>

                {!isAdminUser ? (
                  <div className="react-inline-actions" style={{ justifyContent: 'flex-end' }}>
                    <span className="react-muted" style={{ fontSize: '14px' }}>Admin only - View and select Plan Mode for PDF</span>
                  </div>
                ) : null}

                <label>
                  <span className="react-label">Notes</span>
                  <textarea
                    className="react-textarea"
                    rows={5}
                    value={programsState.programFields.notesText}
                    readOnly={!isEditingPrograms || !isAdminUser}
                    onChange={(event) => updateNotes(event.target.value)}
                    placeholder="Enter notes from Programs section"
                  />
                </label>
                <label>
                  <span className="react-label">Personal Notes (Admin Only)</span>
                  <textarea
                    className="react-textarea"
                    rows={4}
                    value={programsState.programFields.personalNotesText || ''}
                    readOnly={!isEditingPrograms || !canEditAdminPersonalNotes}
                    onChange={(event) => updateProgramField('personalNotesText', event.target.value)}
                    placeholder="Private notes for admin use"
                  />
                  {!canEditAdminPersonalNotes ? (
                    <small className="react-muted">Only admin can edit personal notes.</small>
                  ) : null}
                </label>
                <div className="react-grid react-grid-2">
                  <label>
                    <span className="react-label">Mental Observation</span>
                    <textarea
                      className="react-textarea"
                      rows={3}
                      value={programsState.programFields.mentalText}
                      readOnly={!isEditingPrograms || !isAdminUser}
                      onChange={(event) => updateProgramField('mentalText', event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="react-label">Supplements</span>
                    <textarea
                      className="react-textarea"
                      rows={3}
                      value={programsState.programFields.supplementsText}
                      readOnly={!isEditingPrograms || !isAdminUser}
                      onChange={(event) => updateProgramField('supplementsText', event.target.value)}
                    />
                  </label>
                </div>
                <div className="react-grid react-grid-2">
                  <label>
                    <span className="react-label">Competition Status</span>
                    <select
                      className="react-input"
                      value={programsState.programFields.competitionStatus}
                      disabled={!isEditingPrograms || !isAdminUser}
                      onChange={(event) => updateProgramField('competitionStatus', event.target.value)}
                    >
                      <option value="">None</option>
                      <option value="set">Set</option>
                    </select>
                  </label>
                  <label>
                    <span className="react-label">Plan Mode {!isAdminUser ? '(for PDF generation)' : ''}</span>
                    <div className="react-inline-actions" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={programsState.programFields.competitionEnabled ? 'react-btn' : 'react-btn react-btn-ghost'}
                        disabled={isAdminUser && !isEditingPrograms}
                        onClick={() => updateProgramField('competitionEnabled', true)}
                      >
                        Competition Enabled
                      </button>
                      <button
                        type="button"
                        className={!programsState.programFields.competitionEnabled ? 'react-btn' : 'react-btn react-btn-ghost'}
                        disabled={isAdminUser && !isEditingPrograms}
                        onClick={() => updateProgramField('competitionEnabled', false)}
                      >
                        Normal plan Enabled
                      </button>
                    </div>
                  </label>
                </div>

                <div className="react-row-between" style={{ marginTop: 8 }}>
                  <h3 style={{ margin: 0 }}>Weekly Meal Plan</h3>
                  <button className="react-btn" type="button" onClick={addMeal} disabled={!isEditingPrograms || !isAdminUser}>+ Add Meal</button>
                </div>

                <div className="react-day-tabs">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`react-day-tab ${day === selectedDay ? 'active' : ''}`}
                      onClick={() => setSelectedDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {!dayMeals.length ? (
                  <p className="react-muted" style={{ margin: 0 }}>No meals added for {selectedDay}.</p>
                ) : (
                  <div className="react-meals-list">
                    {dayMeals.map((meal, index) => (
                      <article key={meal.id} className="react-meal-card">
                        <div className="react-grid react-grid-2">
                          <label>
                            <span className="react-label">Meal Type</span>
                            <input
                              className="react-input"
                              value={meal.type}
                              readOnly={!isEditingPrograms || !isAdminUser}
                              onChange={(event) => updateMeal(meal.id, 'type', event.target.value)}
                            />
                          </label>
                          <label>
                            <span className="react-label">{competitionEnabled ? 'Notes' : 'Time'}</span>
                            <input
                              className="react-input"
                              value={competitionEnabled ? (meal.notes || '') : (meal.time || '')}
                              readOnly={!isEditingPrograms || !isAdminUser}
                              onChange={(event) => updateMeal(meal.id, competitionEnabled ? 'notes' : 'time', event.target.value)}
                              placeholder={competitionEnabled ? 'e.g. before warmup' : 'e.g. 07:00 AM'}
                            />
                          </label>
                        </div>

                        <label>
                          <span className="react-label">English Description</span>
                          <textarea
                            className="react-textarea"
                            rows={2}
                            value={meal.en}
                            readOnly={!isEditingPrograms || !isAdminUser}
                            onChange={(event) => updateMeal(meal.id, 'en', event.target.value)}
                          />
                        </label>

                        <label>
                          <span className="react-label">Arabic Description</span>
                          <textarea
                            className="react-textarea"
                            rows={2}
                            value={meal.ar}
                            readOnly={!isEditingPrograms || !isAdminUser}
                            onChange={(event) => updateMeal(meal.id, 'ar', event.target.value)}
                          />
                        </label>

                        <div className="react-row-between">
                          <small className="react-muted">Meal #{index + 1}</small>
                          <div className="react-inline-actions">
                            <button className="react-btn react-btn-ghost" type="button" disabled={!isEditingPrograms || !isAdminUser} onClick={() => moveMealUp(meal.id)}>Up</button>
                            <button className="react-btn react-btn-ghost" type="button" disabled={!isEditingPrograms || !isAdminUser} onClick={() => moveMealDown(meal.id)}>Down</button>
                            <button className="react-btn react-btn-danger" type="button" disabled={!isEditingPrograms || !isAdminUser} onClick={() => deleteMeal(meal.id)}>Delete</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="react-inline-actions" style={{ justifyContent: 'flex-end' }}>
                  <button className="react-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Programs'}</button>
                </div>
              </form>
            </div>
          ) : null}
        </section>
      </div>
      {activeTab === 'programs' && isAdminUser ? (
        <button
          className="react-btn react-btn-ghost detail-floating-programs-edit"
          type="button"
          onClick={() => setIsEditingPrograms((prev) => !prev)}
        >
          {isEditingPrograms ? 'Stop Editing' : 'Edit'}
        </button>
      ) : null}
    </main>
  );
}

export default ClientDetail;
