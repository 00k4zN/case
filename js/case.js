(() => {
    const API = "https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json";
    const FAV_STORAGE_KEY = "userFavorites";
    const INVENTORY_CACHE_KEY = "carouselInventory";
    
    let inventory = [];
    let favorites = [];
    let appStarted = false;
    
    const self = {
        init: function() {
            if (appStarted) return;
            
            if (!this.checkCurrentPage()) {
                console.log("wrong page");
                return;
            }
    
            appStarted = true;
            
            this.loadFavorites();
            
            try {
                const cachedInventory = localStorage.getItem(INVENTORY_CACHE_KEY);
                if (cachedInventory && cachedInventory !== "undefined") {
                    inventory = JSON.parse(cachedInventory);
                    if (Array.isArray(inventory) && inventory.length > 0) {
                        console.log("localStoragetan yüklendi. Tekrar başlatma.");
                        this.createCarousel();
                        return;
                    }
                }
            } catch (e) {
                console.warn("Önbellekteki veri erişilemez durumda, uzak sunucudan alınıyor:", e);
                localStorage.removeItem(INVENTORY_CACHE_KEY);
            }
            
            console.log("İlk başlatma: Veriler yükleniyor...");
            this.getInventory();
        },
        
        checkCurrentPage: function() {
            return window.location.pathname === "/" || 
            window.location.pathname === "/index.html" || 
            window.location.pathname === "/index.php" ||
            window.location.pathname === "/home";
        },
        
        loadFavorites: function() {
            try {
                const savedFavorites = localStorage.getItem(FAV_STORAGE_KEY);
                if (savedFavorites && savedFavorites !== "undefined") {
                    favorites = JSON.parse(savedFavorites);
                    console.log("Favori listesi yüklendi:", favorites);
                } else {
                    favorites = [];
                }
            } catch (e) {
                console.warn("Favori listesi okunamadı:", e);
                favorites = [];
                localStorage.removeItem(FAV_STORAGE_KEY);
            }
        },
        
        getInventory: async function() {
            try {
                const response = await fetch(API);
                if (!response.ok) {
                    throw new Error(`Sunucu yanıt vermedi: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    inventory = data.map(item => {
                        return item;
                    });
                } else {
                    console.error("Sunucu verisi geçersiz format:", data);
                    return;
                }
                
                if (!inventory || inventory.length === 0) {
                    console.error("Envanter boş");
                    return;
                }
                
                localStorage.setItem(INVENTORY_CACHE_KEY, JSON.stringify(inventory));
                
                this.createCarousel();
            } catch (error) {
                console.error("Envanter yüklenemedi:", error);
            }
        },
        
        createCarousel: function() {
            this.buildHTML();
            this.buildCSS();
            this.setEvents();
        },
        
        buildHTML: function() {
            if (!inventory || inventory.length === 0) {
                console.error("Ürün koleksiyonu bulunamadı");
                return;
            }
            
            const existingCarousel = document.querySelector('.carousel-container');
            if (existingCarousel) {
                existingCarousel.remove();
            }
    
            const existingSpacers = document.querySelectorAll('.carousel-bottom-spacer');
            existingSpacers.forEach(spacer => spacer.remove());
            
            const pageSection = document.createElement('div');
            pageSection.className = 'page-section';
            
            const carouselContainer = document.createElement('div');
            carouselContainer.className = 'carousel-container';
            carouselContainer.style.position = 'relative';
            
            const headerSection = document.createElement('div');
            headerSection.className = 'carousel-header';
            
            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'carousel-title-wrapper';
            
            const headerTitle = document.createElement('h2');
            headerTitle.className = 'carousel-title';
            headerTitle.textContent = 'Beğenebileceğinizi düşündüklerimiz';
            
            titleWrapper.appendChild(headerTitle);
            headerSection.appendChild(titleWrapper);
            
            const carouselTrack = document.createElement('div');
            carouselTrack.className = 'carousel-track';
            
            const prevArrow = document.createElement('button');
            prevArrow.className = 'carousel-arrow prev-arrow';
            prevArrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>';
            
            const nextArrow = document.createElement('button');
            nextArrow.className = 'carousel-arrow next-arrow';
            nextArrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>';
            
            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'carousel-wrapper';
            carouselWrapper.style.width = (inventory.length * 244) + 'px';
            carouselWrapper.style.transform = 'translate3d(0px, 0px, 0px)';
            carouselWrapper.style.transition = 'all 0s ease 0s';
            
            inventory.forEach((item, idx) => {
                if (!item || typeof item !== 'object') {
                    console.warn("Geçersiz ürün verisi:", item);
                    return;
                }
                
                const itemCard = this.generateItemCard(item, idx);
                carouselWrapper.appendChild(itemCard);
            });
            
            carouselTrack.appendChild(carouselWrapper);
            
            carouselContainer.appendChild(headerSection);
            carouselContainer.appendChild(prevArrow);
            carouselContainer.appendChild(carouselTrack);
            carouselContainer.appendChild(nextArrow);
            
            pageSection.appendChild(carouselContainer);
            
            const bottomSpacer = document.createElement('div');
            bottomSpacer.className = 'carousel-bottom-spacer';
            bottomSpacer.id = 'unique-spacer'; 
            
            const targetSection = document.querySelector('.banner__titles');
            
            if (targetSection) {
                targetSection.parentNode.insertBefore(pageSection, targetSection);
                targetSection.parentNode.insertBefore(bottomSpacer, targetSection);
                console.log("Carousel başarıyla yerleştirildi");
            } else {
                console.warn("Ana hedef bulunamadı, alternatifler deneniyor");
                
                const fallbackTargets = [
                    '.banner-bg',
                    '.container',
                    '.main-content',
                    'main',
                    'body'
                ];
                
                let targetFound = false;
                
                for (const selector of fallbackTargets) {
                    const target = document.querySelector(selector);
                    if (target) {
                        target.parentNode.insertBefore(pageSection, target);
                        target.parentNode.insertBefore(bottomSpacer, target);
                        console.log(`Carousel ${selector} öncesine yerleştirildi`);
                        targetFound = true;
                        break;
                    }
                }
                
                if (!targetFound) {
                    document.body.appendChild(pageSection);
                    document.body.appendChild(bottomSpacer);
                    console.warn("Hedef bulunamadı, sayfa sonuna eklendi");
                }
            }
        },
        
        buildCSS: function() {
            const styles = `
            .carousel-bottom-spacer {
                height: 60px;
                width: 100%;
                clear: both;
            }
            
            .page-section {
                position: relative;
                max-width: 1320px;
                margin: 40px auto;
                padding: 0;
            }
            
            .carousel-container {
                max-width: 1320px;
                margin: 0 auto;
                font-family: Poppins, "cursive", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                position: relative;
            }
            
            .carousel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background-color: #fef6eb;
                padding: 25px 67px;
                border-top-left-radius: 35px;
                border-top-right-radius: 35px;
                font-family: Quicksand-Bold;
                font-weight: 700;
                margin-bottom: 0;
            }
            
            .carousel-title-wrapper {
                display: flex;
                align-items: center;
            }
            
            .carousel-title {
                font-family: Quicksand-Bold;
                font-size: 3rem;
                font-weight: 700;
                line-height: 1.11;
                color: #f28e00;
                margin: 0;
            }
            
            .carousel-track {
                overflow: hidden;
                padding: 0;
                box-shadow: 15px 15px 30px 0 #ebebeb80;
                background-color: #fff;
                border-bottom-left-radius: 35px;
                border-bottom-right-radius: 35px;
            }
            
            .carousel-wrapper {
                display: flex;
                transition: transform 0.20s ease-out;
                padding: 20px 0px 20px 0px;
            }
            
            .carousel-item {
                flex-shrink: 0;
                padding: 8px 0;
                margin-right: 16px;
                width: 244px; 
                height: 520px;
                transition: all 0.3s ease;
            }
            
            .carousel-item:last-child {
                margin-right: 0;
            }
            
            .product-card {
                z-index: 1;
                display: block;
                width: 100%;
                font-family: Poppins,"cursive";
                font-size: 12px;
                padding: 5px;
                color: #7d7d7d;
                margin: 0 0 20px 3px;
                border: 1px solid #ededed; 
                border-radius: 10px;
                position: relative;
                overflow: hidden;
                text-decoration: none;
                background-color: #fff;
                box-sizing: border-box;
            }
            
            .full-link-wrapper {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                pointer-events: none;
            }
            
            .product-link {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                pointer-events: auto;
            }
            
            .product-card:hover {
                box-shadow: inset 0 0 0 3.3px #F28E00; 
            }   
            
            .image-container {
                position: relative;
                width: 100%;
                height: 245px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .product-image {
                width: 100%;
                height: auto;
                object-fit: contain;
            }
            
            .savings-label {
                display: inline-block;
                background: white;
                color: #00A365;
                border-radius: 4px;
                padding: 2px 6px;
                font-size: 18px;
                font-weight: 700;
            }
            
            .favorites-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: white;
                border: none;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 3;
                padding: 0;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            
            .favorites-btn img {
                width: 25px;
                height: 25px;
            }
            
            .favorites-btn:hover img,
            .favorites-btn.in-favorites img {
                width: 50px;
                height: 50px;
            }
            
            .favorites-btn.in-favorites img {
                display: none;
            }
            
            .favorites-btn .filled-heart {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 25px;
                height: 25px;
                display: none;
            }
            
            .favorites-btn.in-favorites .filled-heart {
                display: block;
            }
            
            .add-to-cart-btn {
                position: relative;
                z-index: 2;
                pointer-events: auto;
                align-items: center;
                justify-content: center;
                display: flex;
                text-align: center;
            }
            
            .product-details {
                padding: 0 17px;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                height: 180px;
            }
            
            .product-description {
                padding-top: 17px;
                height: 65px; 
                overflow: hidden;
                margin-bottom: 15px;
            }
            
            .product-title {
                font-size: 1.2rem;
                color: #7D7D7D;
                font-weight: 500;
                line-height: 1.222222;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                max-height: 90px;
            }
            
            .product-maker {
                font-weight: bolder;
                color: #7D7D7D;
            }
            
            .price-section {
                display: flex;
                flex-direction: column;
                height: 45px;
                margin-top: 0;
                margin-bottom: 30px;
            }
            
            .price-container {
                display: flex;
                flex-direction: column;
                width: 100%;
            }
            
            .price-info {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
                height: 22px;
            }
            
            .current-price {
                font-size: 21.12px;
                font-weight: 600;
                color: #00A365;
                line-height: 1.2;
                height: 25px;
            }
            
            .no-discount {
                color: #7D7D7D;
            }
            
            .list-price {
                font-size: 13.44px;
                text-decoration: line-through;
                color: #7D7D7D;
                margin-right: 6px;
            }
            
            .add-to-cart-btn {
                width: 200px;
                height: 48px;
                padding: 15px 20px;
                border-radius: 37.5px;
                background-color: #fff7ec;
                color: #f28e00;
                font-family: Poppins, "cursive";
                font-size: 1.4rem;
                font-weight: 700;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 0 auto 17px;
            }
            
            .add-to-cart-btn:hover {
                background-color: #f28e00 !important;
                color: #fff !important;
            }
            
            .carousel-arrow {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 48px;
                height: 48px;
                background-color: #fff7ec;
                border: 1px solid transparent;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                color: #f28e00;
                opacity: 1;
                pointer-events: auto;
            }
            
            .carousel-arrow:hover {
                background-color: #fff;
                color: #f28e00;
                border: 1px solid #f28e00;
            }
            
            .prev-arrow {
                left: -60px;
            }
            
            .next-arrow {
                right: -60px;
            }
            
            .carousel-arrow svg {
                width: 34px;
                height: 34px;
                fill: currentColor;
            }

            @media (max-width: 480px) {
                .carousel-header {
                    padding:0 22px 0 10px;
                    background-color: #fff
                }
            }
            
            @media (max-width: 480px) {
                .product-details,
                .add-to-cart-btn {
                    padding:0 10px 10px
                }
            }
            
            @media (max-width: 1280px) {
                .carousel-container {
                    max-width: 960px;
                }
                .prev-arrow {
                    padding-left: 15px;
                }
                .next-arrow {
                    padding-right: 15px;
                }
            }
            
            @media (max-width: 992px) {
                .product-card,
                .page-section,
                .carousel-container {
                    max-width: 960px;
                }
            }
            
            @media (max-width: 768px) {
                .page-section,
                .carousel-container {
                    max-width: 540px;
                }
                
                .carousel-title {
                    font-size: 18px;
                }
                
                .carousel-bottom-spacer {
                    height: 40px;
                }
            }
            
            @media (max-width: 480px) {
                .carousel-title {
                    font-size:2.2rem;
                    line-height: 1.5;
                }
                
                .carousel-bottom-spacer {
                    height: 30px;
                }
            }
            `;
            
            const existingStyles = document.querySelector('.carousel-styles');
            if (existingStyles) {
                existingStyles.textContent = styles;
            } else {
                const styleElement = document.createElement('style');
                styleElement.className = 'carousel-styles';
                styleElement.textContent = styles;
                document.head.appendChild(styleElement);
            }
        },
        
        setEvents: function() {
            const cards = document.querySelectorAll('.product-card');
            cards.forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.favorites-btn') || e.target.closest('.add-to-cart-btn')) {
                        e.stopPropagation();
                    }
                });
            });
            
            const favoriteBtns = document.querySelectorAll('.favorites-btn');
            favoriteBtns.forEach(btn => {
                const favoriteIcon = btn.querySelector('.favorites-icon');
                
                btn.addEventListener('mouseenter', () => {
                    if (!btn.classList.contains('in-favorites')) {
                        favoriteIcon.src = 'https://www.e-bebek.com/assets/svg/default-hover-favorite.svg';
                    }
                });
                
                btn.addEventListener('mouseleave', () => {
                    if (!btn.classList.contains('in-favorites')) {
                        favoriteIcon.src = 'https://www.e-bebek.com/assets/svg/default-favorite.svg';
                    }
                });
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const productCard = btn.closest('.product-card');
                    if (!productCard) return;
                    
                    const itemId = parseInt(productCard.dataset.itemId, 10);
                    if (isNaN(itemId)) return;
                    
                    this.toggleFavoriteItem(itemId, btn, productCard, favoriteIcon);
                });
            });
            
            const prevBtn = document.querySelector('.prev-arrow');
            const nextBtn = document.querySelector('.next-arrow');
            const carouselTrack = document.querySelector('.carousel-wrapper');
            
            if (prevBtn && nextBtn && carouselTrack) {
                let position = 0;
                
                const firstItem = document.querySelector('.carousel-item');
                if (!firstItem) {
                    console.warn("Carousel öğeleri bulunamadı");
                    return;
                }
                
                const itemWidth = firstItem.offsetWidth + 20;
                let visibleCount = this.getVisibleItemCount();
                let maxPosition = Math.max(0, inventory.length - visibleCount);
                
                prevBtn.style.opacity = '1';
                prevBtn.style.pointerEvents = 'auto';
                
                const updateCarouselPosition = () => {
                    setTimeout(() => {
                        carouselTrack.style.transition = `transform 0.20s ease-out`;
                        carouselTrack.style.transform = `translate3d(-${position * itemWidth}px, 0px, 0px)`;
                    });
                };
                
                const updateNavigationState = () => {
                    prevBtn.style.opacity = '1';
                    prevBtn.style.pointerEvents = 'auto';
                    
                    nextBtn.style.opacity = '1';
                    nextBtn.style.pointerEvents ='auto';
                };
                
                prevBtn.addEventListener('click', () => {
                    if (position > 0) {
                        position--;
                        updateCarouselPosition();
                    }
                    
                    updateNavigationState();
                });
                
                nextBtn.addEventListener('click', () => {
                    if (position < maxPosition) {
                        position++;
                        updateCarouselPosition();
                    }
                    
                    updateNavigationState();
                });
                
                window.addEventListener('resize', () => {
                    const newVisibleCount = this.getVisibleItemCount();
                    const newMaxPosition = Math.max(0, inventory.length - newVisibleCount);
                    
                    if (position > newMaxPosition) {
                        position = newMaxPosition;
                        updateCarouselPosition();
                    }
                    
                    maxPosition = newMaxPosition;
                    updateNavigationState();
                });
            }
            
            const cartBtns = document.querySelectorAll('.add-to-cart-btn');
            cartBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const productCard = btn.closest('.product-card');
                    if (!productCard) return;
                    
                    const itemId = parseInt(productCard.dataset.itemId, 10);
                    if (isNaN(itemId)) return;
                    
                    const item = inventory.find(p => p.id === itemId);
                    if (!item) return;
                    
                    console.log(`"${item.name}" sepete eklendi!`);
                    alert(`"${item.name}" sepete eklendi!`);
                });
            });
        },
        
        generateItemCard: function(item, idx) {
            try {
                const itemId = item.id ? item.id : Math.floor(Math.random() * 10000);
                const maker = item.brand || "";
                const title = item.name || "Ürün İsmi";
                const itemUrl = item.url || "#";
                const image = item.img || "https://via.placeholder.com/150";
                const currentPrice = typeof item.price !== 'undefined' ? item.price : 0;
                const listPrice = typeof item.original_price !== 'undefined' ? item.original_price : currentPrice;
                const hasDiscount = currentPrice < listPrice;
                const savingsPercent = hasDiscount ? Math.round((listPrice - currentPrice) * 100 / listPrice) : 0;
                
                const isInFavorites = favorites.includes(itemId);
                
                const carouselItem = document.createElement('div');
                carouselItem.className = 'carousel-item active';
                carouselItem.style.width = '242px';
                carouselItem.style.marginRight = '20px';
                
                const productItem = document.createElement('div');
                productItem.className = `product-card ${isInFavorites ? 'in-favorites' : ''}`;
                productItem.dataset.itemId = itemId;
                
                productItem.innerHTML = `
                <div class="full-link-wrapper">
                    <a href="${itemUrl}" class="product-link" target="_blank"></a>
                </div>
                <div class="image-container">
                    <img class="product-image" src="${image}" alt="${title}">
                    <button class="favorites-btn ${isInFavorites ? 'in-favorites' : ''}">
                        <img src="${isInFavorites ? 'https://www.e-bebek.com/assets/svg/default-hover-favorite.svg' : 'https://www.e-bebek.com/assets/svg/default-favorite.svg'}" 
                            alt="Favorilere Ekle" 
                            class="favorites-icon">
                        <svg class="filled-heart" viewBox="0 0 24 24" width="25" height="25">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#F28E00"/>
                        </svg>
                    </button>
                </div>
                <div class="product-details">
                    <div class="product-description">
                        <span class="product-title">
                            <span class="product-maker">${maker}</span> - ${title}
                        </span>
                    </div>
                    <div class="price-section">
                        <div class="price-container">
                            <div class="price-info">
                                ${hasDiscount ? `
                                    <span class="list-price">${listPrice.toFixed(2)} TL</span>
                                    <span class="savings-label">%${savingsPercent}</span>
                                ` : `
                                    <span style="visibility: hidden;">&nbsp;</span>
                                `}
                            </div>
                            <span class="current-price ${!hasDiscount ? 'no-discount' : ''}">${currentPrice.toFixed(2)} TL</span>
                        </div>
                    </div>
                </div>
                <button class="add-to-cart-btn">Sepete Ekle</button>
                `;
                
                carouselItem.appendChild(productItem);
                
                return carouselItem;
            } catch (error) {
                console.error("Ürün kartı oluşturulamadı:", error, item);
                return document.createElement('div');
            }
        },
        
        getVisibleItemCount: function() {
            const screenWidth = window.innerWidth;
            
            if (screenWidth >= 1200) {
                return 5;
            } else if (screenWidth >= 992) {
                return 3;
            } else if (screenWidth >= 768) {
                return 2;
            } else {
                return 1;
            }
        },
        
        toggleFavoriteItem: function(itemId, btn, card, icon) {
            const id = parseInt(itemId, 10);
            const idx = favorites.findIndex(favId => favId === id);
            
            if (idx === -1) {
                favorites.push(id);
                btn.classList.add('in-favorites');
                if (card) {
                    card.classList.add('in-favorites');
                }
                console.log(`Ürün #${id} favorilere eklendi`);
            } else {
                favorites.splice(idx, 1);
                btn.classList.remove('in-favorites');
                if (card) {
                    card.classList.remove('in-favorites');
                }
                console.log(`Ürün #${id} favorilerden kaldırıldı`);
            }
            
            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
        }
    };
    
    self.init();
})();