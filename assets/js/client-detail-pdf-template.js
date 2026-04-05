// client-detail-pdf-template.js

window.ClientDetailPdfTemplate = {
    generate: async function ({ data, lang = "en" }) {
        try {
            const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
            const isRTL = lang === "ar";
            const pdfDoc = await PDFDocument.create();
            let unicodeFontReady = false;

            // --- 1. FONT LOADING ---
            let font;
            const fontSource = window.PDF_ASSETS && window.PDF_ASSETS.CAIRO_FONT;
            const hasFontkit = typeof window.fontkit !== "undefined";
            if (fontSource && hasFontkit) {
                try {
                    if (typeof pdfDoc.registerFontkit === "function") {
                        pdfDoc.registerFontkit(window.fontkit);
                    }
                    const cleanFontBase64 = fontSource.includes(',') ? fontSource.split(',')[1] : fontSource;
                    const fontBytes = Uint8Array.from(atob(cleanFontBase64.trim()), c => c.charCodeAt(0));
                    font = await pdfDoc.embedFont(fontBytes);
                    unicodeFontReady = true;
                } catch (fontErr) {
                    console.warn("Custom font embed failed, using Helvetica fallback:", fontErr);
                }
            }
            if (!font) {
                font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                unicodeFontReady = false;
            }

            // --- 2. IMAGE LOADING ---
            let bgImage = null;
            const embedImageBytes = async (bytes, mimeHint = "") => {
                const hint = (mimeHint || "").toLowerCase();
                if (hint.includes("jpeg") || hint.includes("jpg")) {
                    return pdfDoc.embedJpg(bytes);
                }
                if (hint.includes("png")) {
                    return pdfDoc.embedPng(bytes);
                }
                try {
                    return await pdfDoc.embedPng(bytes);
                } catch (_) {
                    return pdfDoc.embedJpg(bytes);
                }
            };

            async function loadImageViaElementAsPngBytes(url) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        try {
                            const canvas = document.createElement("canvas");
                            canvas.width = img.naturalWidth || img.width;
                            canvas.height = img.naturalHeight || img.height;
                            const ctx = canvas.getContext("2d");
                            if (!ctx) {
                                reject(new Error("Canvas context unavailable"));
                                return;
                            }
                            ctx.drawImage(img, 0, 0);
                            const pngUrl = canvas.toDataURL("image/png");
                            const raw = pngUrl.split(",")[1];
                            const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
                            resolve(bytes);
                        } catch (e) {
                            reject(e);
                        }
                    };
                    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
                    img.src = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
                });
            }

            const bgSource = window.PDF_ASSETS && window.PDF_ASSETS.BG_IMAGE;
            const bgImageUrl = window.PDF_ASSETS && window.PDF_ASSETS.BG_IMAGE_URL;

            if (!bgImage && bgImageUrl) {
                try {
                    const res = await fetch(bgImageUrl, { cache: "no-store" });
                    if (res.ok) {
                        const imageBytes = new Uint8Array(await res.arrayBuffer());
                        const contentType = res.headers.get("content-type") || bgImageUrl;
                        bgImage = await embedImageBytes(imageBytes, contentType);
                    }
                } catch (urlErr) {
                    console.warn("Configured BG_IMAGE_URL failed, falling back:", urlErr);
                }
            }

            if (bgSource) {
                try {
                    const commaIndex = bgSource.indexOf(',');
                    const header = commaIndex >= 0 ? bgSource.slice(0, commaIndex).toLowerCase() : "";
                    const rawBase64 = commaIndex >= 0 ? bgSource.slice(commaIndex + 1) : bgSource;
                    const imageBytes = Uint8Array.from(atob(rawBase64.trim()), c => c.charCodeAt(0));
                    bgImage = await embedImageBytes(imageBytes, header);
                } catch (imgErr) {
                    console.warn("Background image embed failed; generating PDF without background:", imgErr);
                    bgImage = null;
                }
            }

            // If no embedded background exists, try image files from the project.
            if (!bgImage) {
                const protocol = (window.location && window.location.protocol) || "";
                const canFetchAssets = protocol === "http:" || protocol === "https:";
                if (!canFetchAssets) {
                    console.info("Skipping background URL fetch on non-http(s) protocol:", protocol);
                }
                if (canFetchAssets) {
                const fallbackUrls = ["images/pdf-bg-custom.png", "images/bb.png", "images/bb.jpg", "/images/pdf-bg-custom.png", "/images/bb.png", "/images/bb.jpg"];
                for (const imageUrl of fallbackUrls) {
                    try {
                        const res = await fetch(imageUrl, { cache: "no-store" });
                        if (!res.ok) {
                            continue;
                        }
                        const imageBytes = new Uint8Array(await res.arrayBuffer());
                        const contentType = res.headers.get("content-type") || imageUrl;
                        bgImage = await embedImageBytes(imageBytes, contentType);
                        break;
                    } catch (_) {
                        // Try next URL candidate.
                    }
                }
                }
            }

            if (!bgImage) {
                const fallbackUrls = ["images/pdf-bg-custom.png", "images/bb.png", "images/bb.jpg", "/images/pdf-bg-custom.png", "/images/bb.png", "/images/bb.jpg"];
                for (const imageUrl of fallbackUrls) {
                    try {
                        const bytes = await loadImageViaElementAsPngBytes(imageUrl);
                        bgImage = await pdfDoc.embedPng(bytes);
                        break;
                    } catch (_) {
                        // Try next local path.
                    }
                }
            }

            // --- 3. ARABIC HELPER ---
            const processText = (text) => {
                if (!text) return "";
                if (!isRTL || !unicodeFontReady) return text;
                // Reshape connects Arabic letters, then we reverse for PDF-Lib positioning
                const reshaped = window.ArabicReshaper ? window.ArabicReshaper.reshape(text) : text;
                return reshaped.split('').reverse().join('');
            };

            const hasArabicChars = (text) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text || "");
            const colorToCss = (color) => {
                if (!color || typeof color.r !== "number") return "#000";
                const r = Math.round(Math.max(0, Math.min(1, color.r)) * 255);
                const g = Math.round(Math.max(0, Math.min(1, color.g)) * 255);
                const b = Math.round(Math.max(0, Math.min(1, color.b)) * 255);
                return `rgb(${r}, ${g}, ${b})`;
            };

            const embedPngFromDataUrl = async (dataUrl) => {
                const raw = dataUrl.split(",")[1];
                const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
                return pdfDoc.embedPng(bytes);
            };

            const measureTextSafe = (text, size) => {
                const inputText = text || "";
                if (hasArabicChars(inputText) && !unicodeFontReady) {
                    return inputText.length * size * 0.62;
                }
                const outputText = processText(inputText);
                return font.widthOfTextAtSize(outputText, size);
            };

            const drawTextSafe = async (page, text, opts) => {
                const { x, y, size, color, rtlPreferred = false, rightEdge = width - 60 } = opts;
                const inputText = text || "";

                if (hasArabicChars(inputText) && !unicodeFontReady) {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    ctx.font = `${size}px sans-serif`;
                    const measured = Math.ceil(ctx.measureText(inputText).width);
                    const canvasWidth = Math.max(10, measured + 10);
                    const canvasHeight = Math.max(12, Math.ceil(size * 1.8));

                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                    ctx.font = `${size}px sans-serif`;
                    ctx.fillStyle = colorToCss(color);
                    ctx.textBaseline = "top";
                    if (rtlPreferred || isRTL) {
                        ctx.direction = "rtl";
                        ctx.textAlign = "right";
                        ctx.fillText(inputText, canvasWidth - 4, 2);
                    } else {
                        ctx.textAlign = "left";
                        ctx.fillText(inputText, 4, 2);
                    }

                    const image = await embedPngFromDataUrl(canvas.toDataURL("image/png"));
                    const drawX = (rtlPreferred || isRTL) ? (rightEdge - canvasWidth) : x;
                    page.drawImage(image, { x: drawX, y, width: canvasWidth, height: canvasHeight });
                    return;
                }

                const outputText = processText(inputText);
                page.drawText(outputText, { x, y, size, font, color });
            };

            const width = 595;
            const height = 842;
            const labels = {
                en: { title: "NUTRITION PLAN", notes: "Notes", supps: "Supplements", mental: "Observations" },
                ar: { title: "الخطة الغذائية", notes: "ملاحظات", supps: "المكملات", mental: "ملاحظات ذهنية" }
            };

            // --- 4. CARD DRAWING LOGIC ---
            const drawCard = async (page, title, items, startY) => {
                const rowHeight = 30;
                const titleHeight = 40;
                const cardX = 30;
                const cardWidth = width - 60;
                const contentHeight = titleHeight + (items.length * rowHeight) + 15;
                const leftColWidth = 220;

                // Transparent outer shell.
                page.drawRectangle({
                    x: cardX, y: startY - contentHeight,
                    width: cardWidth, height: contentHeight,
                    color: rgb(1, 1, 1), opacity: 0.2,
                    borderColor: rgb(0.09, 0.4, 0.28), borderWidth: 1.2
                });

                // Transparent header strip.
                page.drawRectangle({
                    x: cardX, y: startY - titleHeight,
                    width: cardWidth, height: titleHeight,
                    color: rgb(1, 1, 1), opacity: 0.3
                });

                const headerText = processText(title);
                const titleX = isRTL ? width - 60 - measureTextSafe(headerText, 14) : 60;
                await drawTextSafe(page, title, {
                    x: titleX,
                    y: startY - 22,
                    size: 14,
                    color: rgb(0.06, 0.22, 0.14),
                    rtlPreferred: true,
                    rightEdge: width - 60
                });

                let currentY = startY - titleHeight - 20;
                for (let idx = 0; idx < items.length; idx += 1) {
                    const item = items[idx];
                    const desc = item.description || item;
                    const type = item.type ? `${item.type}: ` : "";
                    const time = item.time ? ` (${item.time})` : "";
                    const fullLineRaw = `${type}${desc}${time}`;
                    const fullLine = processText(fullLineRaw);

                    // Transparent row treatment like the reference design.
                    page.drawRectangle({
                        x: cardX,
                        y: currentY - 10,
                        width: cardWidth,
                        height: rowHeight,
                        color: rgb(1, 1, 1),
                        opacity: idx % 2 === 0 ? 0.12 : 0.08,
                    });
                    page.drawRectangle({
                        x: cardX,
                        y: currentY - 10,
                        width: leftColWidth,
                        height: rowHeight,
                        color: rgb(0.82, 0.84, 0.83),
                        opacity: 0.45,
                    });
                    page.drawLine({
                        start: { x: cardX + leftColWidth, y: currentY - 10 },
                        end: { x: cardX + leftColWidth, y: currentY + 20 },
                        thickness: 0.6,
                        color: rgb(0.55, 0.62, 0.59)
                    });

                    const textX = isRTL ? width - 70 - measureTextSafe(fullLine, 10) : 70;
                    await drawTextSafe(page, fullLineRaw, {
                        x: isRTL ? textX : cardX + leftColWidth + 8,
                        y: currentY,
                        size: 10,
                        color: rgb(0, 0, 0),
                        rtlPreferred: true,
                        rightEdge: width - 70
                    });

                    const leftLabel = item.type || "";
                    const leftTime = item.time || "";
                    await drawTextSafe(page, leftLabel, {
                        x: cardX + 8,
                        y: currentY + 1,
                        size: 9.5,
                        color: rgb(0.08, 0.12, 0.1),
                        rtlPreferred: false,
                        rightEdge: cardX + leftColWidth - 10
                    });
                    if (leftTime) {
                        await drawTextSafe(page, leftTime, {
                            x: cardX + 8,
                            y: currentY - 10,
                            size: 8.5,
                            color: rgb(0.12, 0.12, 0.12),
                            rtlPreferred: false,
                            rightEdge: cardX + leftColWidth - 10
                        });
                    }

                    if (idx < items.length - 1) {
                        page.drawLine({
                            start: { x: 55, y: currentY - 6 },
                            end: { x: width - 55, y: currentY - 6 },
                            thickness: 0.5, color: rgb(0.72, 0.78, 0.76)
                        });
                    }
                    currentY -= rowHeight;
                }
                return contentHeight + 25;
            };

            const drawInfoCard = async (page, title, items, startY) => {
                const rowHeight = 22;
                const titleHeight = 34;
                const cardX = 30;
                const cardWidth = width - 60;
                const contentHeight = titleHeight + (items.length * rowHeight) + 18;

                page.drawRectangle({
                    x: cardX,
                    y: startY - contentHeight,
                    width: cardWidth,
                    height: contentHeight,
                    color: rgb(1, 1, 1),
                    opacity: 0.2,
                    borderColor: rgb(0.09, 0.4, 0.28),
                    borderWidth: 1.2
                });

                page.drawRectangle({
                    x: cardX,
                    y: startY - titleHeight,
                    width: cardWidth,
                    height: titleHeight,
                    color: rgb(1, 1, 1),
                    opacity: 0.3
                });

                const headerText = processText(title);
                const titleX = isRTL ? width - 60 - measureTextSafe(headerText, 13) : cardX + 14;
                await drawTextSafe(page, title, {
                    x: titleX,
                    y: startY - 21,
                    size: 13,
                    color: rgb(0.06, 0.22, 0.14),
                    rtlPreferred: true,
                    rightEdge: width - 60
                });

                let currentY = startY - titleHeight - 16;
                for (const item of items) {
                    const line = typeof item === "string" ? item : (item && item.description ? item.description : String(item || ""));
                    const lineText = processText(line);
                    const x = isRTL ? width - 70 - measureTextSafe(lineText, 10) : cardX + 14;
                    await drawTextSafe(page, line, {
                        x,
                        y: currentY,
                        size: 10,
                        color: rgb(0, 0, 0),
                        rtlPreferred: true,
                        rightEdge: width - 70
                    });
                    currentY -= rowHeight;
                }

                return contentHeight + 20;
            };

            // --- 5. PAGE GENERATION ---
            const meals = data.daySections || [];
            for (let i = 0; i < (meals.length || 1); i += 1) {
                const page = pdfDoc.addPage([width, height]);
                if (bgImage) page.drawImage(bgImage, { x: 0, y: 0, width, height });

                // Centered Main Title
                const mainTitle = processText(labels[lang].title);
                await drawTextSafe(page, labels[lang].title, {
                    x: (width / 2) - (measureTextSafe(mainTitle, 26) / 2),
                    y: height - 70,
                    size: 26,
                    color: rgb(0.1, 0.3, 0.2),
                    rtlPreferred: isRTL,
                    rightEdge: width - 40
                });

                // Centered Client Name
                const clientName = processText(data.client?.name || "Client");
                await drawTextSafe(page, data.client?.name || "Client", {
                    x: (width / 2) - (measureTextSafe(clientName, 18) / 2),
                    y: height - 100,
                    size: 18,
                    color: rgb(0.2, 0.5, 0.3),
                    rtlPreferred: isRTL,
                    rightEdge: width - 40
                });

                let yCursor = height - 150;
                if (meals[i]) yCursor -= await drawCard(page, meals[i].title, meals[i].items || [], yCursor);

                // Add Extras on Last Page
                if (i + 1 >= meals.length) {
                    const extras = [
                        { t: labels[lang].supps, c: data.supplements },
                        { t: labels[lang].notes, c: data.notes },
                        { t: labels[lang].mental, c: data.mentalObservation }
                    ].filter(e => e.c && e.c.length > 0);

                    for (const extra of extras) {
                        const extraItems = Array.isArray(extra.c) ? extra.c : [extra.c];
                        if (yCursor > 150) {
                            yCursor -= await drawInfoCard(page, extra.t, extraItems, yCursor);
                        } else {
                            const newPage = pdfDoc.addPage([width, height]);
                            if (bgImage) newPage.drawImage(bgImage, { x: 0, y: 0, width, height });
                            await drawInfoCard(newPage, extra.t, extraItems, height - 100);
                        }
                    }
                }
            }

            // --- 6. SAVE AND DOWNLOAD ---
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${data.client?.name || 'Plan'}_Nutrition.pdf`;
            link.click();

        } catch (err) {
            console.error("PDF Generation Error:", err);
            const message = err && err.message ? err.message : String(err);
            alert("Error generating PDF: " + message);
        }
    }
};