import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import { Upload, Image as ImageIcon, Download, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import goldStar from '../gold_star.png';
import greyStar from '../grey_star.png';

const VignetteCanvas = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);
      
      const offset = 10000;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 45;
      ctx.shadowOffsetX = offset;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = 'black';
      
      ctx.beginPath();
      ctx.rect(-offset - 100, -100, w + 200, h + 200);
      ctx.rect(-offset, 0, w, h);
      ctx.fill('evenodd');
    }
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      width={400}
      height={300}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2
      }}
    />
  );
};

export default function App() {
  const [cardsData, setCardsData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bgImage, setBgImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [customPhotos, setCustomPhotos] = useState({});
  const [photoBatch, setPhotoBatch] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef(null);
  const hiddenCardsRef = useRef(null);

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCardsData(results.data);
        setCurrentIndex(0);
      }
    });
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setBgImage(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setLogoImage(event.target.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomPhotos(prev => ({ ...prev, [currentIndex]: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoBatchUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoBatch(prev => ({ ...prev, [file.name]: event.target.result }));
      };
      reader.readAsDataURL(file);
    });
  };

  const exportCurrentCard = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { 
        useCORS: true, 
        scale: 2,
        backgroundColor: null 
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `card-${currentIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
    setIsExporting(false);
  };

  const nextCard = () => setCurrentIndex(p => Math.min(cardsData.length - 1, p + 1));
  const prevCard = () => setCurrentIndex(p => Math.max(0, p - 1));

  const renderCard = (card, isPreview = true) => {
    if (!card) return null;
    
    // Fallbacks for missing data
    const name = card.Name || card.name || 'Unknown Name';
    const subtitle = card.Subtitle || card.subtitle || '';
    const photoName = card.PhotoUrl || card.photoUrl || card.photo || '';
    
    // Résolution:
    // 1. Photo uploadée pour cette carte spécifique
    // 2. Photo uploadée via le lot (nom de fichier = CSV)
    // 3. URL absolue (commence par http)
    // 4. Dossier public local (ex: /photos/nom.jpg) si pas uploader
    const photo = customPhotos[currentIndex] || 
                  photoBatch[photoName] || 
                  (photoName.startsWith('http') ? photoName : 
                   (photoName ? `/${photoName}` : 'https://via.placeholder.com/400'));
    
    const rarity = parseInt(card.Rarity || card.rarity || 1);
    const quote = card.Quote || card.quote || '';

    const stats = [];
    for(let i=1; i<=6; i++) {
      const val = card[`Stat${i}Value`] || card[`stat${i}Value`] || card[`Stat${i}`] || '';
      const statName = card[`Stat${i}Name`] || card[`stat${i}Name`] || card[`StatName${i}`] || '';
      if (val || statName) {
        stats.push({ value: val, name: statName });
      }
    }
    
    // Padding empty stats to 6
    while(stats.length < 6) {
      stats.push({ value: '-', name: '-', colorIndex: stats.length });
    }

    // Logique d'équilibrage :
    // 1. Distribution aléatoire des couleurs (La Défense) :
    const shuffledStats = [...stats].map((s, i) => ({ ...s, originalIndex: i }));
    for (let i = shuffledStats.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledStats[i], shuffledStats[j]] = [shuffledStats[j], shuffledStats[i]];
    }


    let maxVal = -1;
    let blackLineIndex = 0;
    shuffledStats.forEach((stat, index) => {
      const val = parseFloat(stat.value) || 0;
      if (val > maxVal) {
        maxVal = val;
        blackLineIndex = index;
      }
    });

    blackLineIndex = Math.floor(Math.random()*6);
    return (
      <div 
        className="tcg-card" 
        ref={isPreview ? cardRef : null}
        style={{
          transform: isPreview ? 'none' : 'scale(1)',
          backgroundImage: bgImage ? `url(${bgImage})` : 'none',
          backgroundColor: bgImage ? 'transparent' : '#fff'
        }}
      >
        <div className="tcg-card-border-outer">
          <div 
            className="tcg-top-black-trait"
            style={{
              left: `${-12+blackLineIndex * 80}px`
            }}
          ></div>
          <div className="tcg-card-border">
            <div className="tcg-card-content">
              
              <div className="tcg-top-banner">
                <div className="tcg-top-banner-content">
                  <h2 className={name.length > 12 ? (name.length > 20 ? "tcg-title-very-small" : "tcg-title-small") : "tcg-title"}>{name}</h2>
                  {subtitle && <p className="tcg-subtitle">dit "{subtitle}"</p>}
                </div>
              </div>
              {logoImage && <img src={logoImage} alt="Logo" className="tcg-logo" />}
              
              <div className="tcg-middle">
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '25px', height: '100%' }}>
                  <div className="tcg-rarity-text">RARETÉ</div>
                  <div className="tcg-rarity-container">
                    <div className="tcg-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <img 
                          key={i} 
                          src={i >= 5-rarity ? goldStar : greyStar} 
                          alt="Star" 
                          className="tcg-star-icon"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="tcg-photo-container">
                  <div 
                    className="tcg-photo"
                    style={{ backgroundImage: `url(${photo})` }}
                  ></div>
                  <VignetteCanvas />
                </div>
              </div>

              <div className="tcg-stats-grid">
                {stats.map((stat, i) => (
                  <div className="tcg-stat" key={i}>
                    <div className={`tcg-stat-circle stat-color-${i % 6}`}>
                      {stat.value}
                    </div>
                    <div className="tcg-stat-name">{stat.name}</div>
                  </div>
                ))}
              </div>

              <div className="tcg-quote">
                {quote ? `«${quote}»` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div className="tcg-bottom-bar">
          {shuffledStats.map((stat, i) => (
            <div 
              key={i}
              className={`tcg-bottom-segment stat-color-${stat.originalIndex}`}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>TCGen</h1>
        <p>Générateur de cartes TCG dynamique</p>
      </div>

      <div className="controls-panel">
        <div className="control-group">
          <label>Données CSV</label>
          <label className="file-upload-btn">
            <FileSpreadsheet size={32} />
            <span>Importer fichier CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvUpload} />
          </label>
          {cardsData.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', textAlign: 'center' }}>
              {cardsData.length} carte(s) chargée(s)
            </span>
          )}
        </div>

        <div className="control-group">
          <label>Personnalisation globale</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="file-upload-btn">
              <ImageIcon size={20} />
              <span style={{ fontSize: '0.8rem' }}>Fond global</span>
              <input type="file" accept="image/*" onChange={handleBgUpload} />
            </label>
            <label className="file-upload-btn">
              <ImageIcon size={20} />
              <span style={{ fontSize: '0.8rem' }}>Logo (haut)</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
            </label>
            <label className="file-upload-btn">
              <ImageIcon size={20} />
              <span style={{ fontSize: '0.8rem' }}>Lot Photos</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotoBatchUpload} />
            </label>
          </div>
          {Object.keys(photoBatch).length > 0 && (
            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#4ade80', textAlign: 'center' }}>
              ✔️ {Object.keys(photoBatch).length} photo(s) chargée(s) en mémoire
            </div>
          )}
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />

        {cardsData.length > 0 && (() => {
          const currentCard = cardsData[currentIndex];
          const rarity = parseInt(currentCard.Rarity || currentCard.rarity || 1);
          const expectedSum = 10 + 5 * rarity;
          let actualSum = 0;
          for(let i=1; i<=6; i++) {
            actualSum += parseFloat(currentCard[`Stat${i}Value`] || currentCard[`stat${i}Value`] || currentCard[`Stat${i}`] || 0);
          }
          const isValid = actualSum === expectedSum;

          return (
            <div className="control-group">
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="button" onClick={prevCard} disabled={currentIndex === 0} style={{ padding: '0.5rem' }}>
                  <ChevronLeft size={20} />
                </button>
                <span>{currentIndex + 1} / {cardsData.length}</span>
                <button className="button" onClick={nextCard} disabled={currentIndex === cardsData.length - 1} style={{ padding: '0.5rem' }}>
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                backgroundColor: isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${isValid ? '#22c55e' : '#ef4444'}`,
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold', color: isValid ? '#4ade80' : '#f87171' }}>
                  {isValid ? '✔️ Statistiques Valides' : '❌ Statistiques Invalides'}
                </div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Somme: {actualSum} / {expectedSum} (Rareté {rarity})
                </div>
                {!isValid && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#f87171' }}>
                    Règle: 10 + 5 × {rarity} = {expectedSum}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label className="file-upload-btn" style={{ padding: '0.75rem' }}>
                  <ImageIcon size={20} />
                  <span style={{ fontSize: '0.8rem' }}>Changer la photo de cette carte</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
          );
        })()}

        <button 
          className="button" 
          onClick={exportCurrentCard}
          disabled={cardsData.length === 0 || isExporting}
        >
          <Download size={20} />
          {isExporting ? 'Export en cours...' : 'Exporter la carte'}
        </button>
      </div>

      <div className="preview-panel">
        {cardsData.length > 0 ? (
          <div className="card-wrapper">
            {renderCard(cardsData[currentIndex])}
          </div>
        ) : (
          <div className="empty-state">
            <Upload size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>Aucune donnée</h3>
            <p>Importez un fichier CSV pour commencer à générer des cartes.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '1rem', opacity: 0.7 }}>
              Colonnes requises: Name, Subtitle, PhotoUrl, Rarity, Quote, Stat1Value...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
