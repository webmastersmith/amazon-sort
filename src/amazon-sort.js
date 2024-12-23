// about:debugging#/runtime/this-firefox
// chrome://extensions/
(async function () {
  // only run function if https address is amazon search page.
  if (/amazon.*\/s\?/i.test(location.href)) {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const fixDecimal = (num) => +(Math.round(num + 'e+2') + 'e-2');
    // GET SEARCH TERM
    const keywords = document.getElementById('twotabsearchtextbox')?.value?.trim()?.toLowerCase()?.split(' ');
    // create the VIEW.
    const head = createStyleSheet();
    if (!head) throw new Error('Could not attach style sheet.');
    // Create form and content
    const { form, checkboxFilter, searchInput, checkboxSort, startPageSpan } = createForm(amazonFilterSort);
    if (!form) throw new Error('Could not create form.');

    // Hook into Amazon page elements.
    // Top Level -before sidebar.
    const mainTopDiv = document.getElementById('search');
    // Get parent element. -grid container with all search results.
    const parent = document.querySelector('div[id*=skipLinkTargetForMainSearchResults] + span > div');
    if (!parent) throw new Error('Could not get Parent node.');
    // Insert Form
    parent.insertBefore(form, parent.firstChild);

    // When 'GO!' btn clicked, this function runs. The Main Logic. All code inside this function.
    async function amazonFilterSort() {
      // All Valid Items HERE.
      const items = [];
      // Create the Loading Page Element.
      const { loadingPageEl, loadingPageWrapper } = loopText();

      // Get values from the form.
      const filterTitle = checkboxFilter.checked; // checked = true // filter results.
      const pages = +searchInput.value || 5;
      const sortByPricePerCount = checkboxSort.checked;
      // remove form from page after submit.
      form.remove();
      parent.insertBefore(loadingPageWrapper, parent.firstChild);

      // START -Loop through pages, add items to memory.
      for (let i = 1; i <= pages; i++) {
        // display the page thats currently loading.
        loadingPageEl.innerText = `Page ${i} of ${pages} loading`;

        // pause for idle
        await new Promise((res, rej) => {
          window.requestIdleCallback(
            () => {
              items.push(getItems(filterTitle));
              res();
            },
            { timeout: 5000 }
          );
        });

        // click next page - wait till pagination container selector loads for slow internet.
        await waitForSelector('div[class*=pagination-container]');
        const nextBtn = document.querySelector('a[class*=pagination-next]');
        // if next page doesn't exist, don't click.
        if (!nextBtn) break;
        // don't click last page
        if (i < pages) {
          nextBtn.click();
          await sleep(2000);
        }
      } // end for loop
      // Remove the 'Page loading' div.
      loadingPageWrapper.remove();
      // Sort Items.
      const sortedItems = priceSort(items.flat(), sortByPricePerCount ? 'pricePerCount' : 'price');
      // Create 'Container' div to insert results.
      // Because Amazon dynamically removes/inserts results, div is placed out of Amazon scope.
      const containerDiv = sortResultsBox();
      // append to page.
      mainTopDiv.before(containerDiv);
      // Create 'Total Search Result' element.
      const headerText = getHeader(sortedItems.length);
      // Add header.
      containerDiv.appendChild(headerText);
      // Add the 'search result' items.
      insertItems(containerDiv, sortedItems);
      // Add footer.
      containerDiv.after(getFooter());

      // FUNCTIONS ----------------------------------------------------------------------------
      function priceSort(itemArr, key) {
        // if key is 'pricePerCount', remove items with '0' pricePerCount value.
        const items = key === 'pricePerCount' ? itemArr.filter((item) => item.pricePerCount > 0) : itemArr;
        const blob = items.toSorted((a, b) => a[key] - b[key]);
        return blob.map((item) => item.el);
      }

      // append items to page.
      function insertItems(parent, items) {
        items.forEach((item) => {
          parent.appendChild(item);
        });
        return;
      }

      // Filter results.
      // isFilter = should you filter title for search words?
      function getItems(isFilter) {
        // keywords and item.title have all been lowerCased.
        return [...document.querySelectorAll('div[class*=main-slot] div[data-uuid]')]
          .map((item) => extractListingFromItem(item))
          .filter((item) => item.isValid)
          .filter((item) => (isFilter ? keywords.every((key) => item.title.includes(key)) : true));
      }

      // process each search result.
      // a copy of each element is made to remove dynamic links and customize.
      function extractListingFromItem(elTemp) {
        // clone node so original results still show.
        const el = elTemp.cloneNode(true);
        // remove classes to prevent dynamic reloads of content.
        el.className = '';
        const wrapper = el.querySelector('div span > div > div.a-section');
        // wrapper could be null.
        if (wrapper) {
          // Because search results are removed from page flow, custom styling has to be added.
          let parent = wrapper;
          // ChildNodes can be 1, 2, or 3 children.
          // if children.length === 1, children are nested in a div.
          if (wrapper.childNodes.length === 1) parent = wrapper.querySelector('div');
          parent.style.display = 'flex';
          parent.style.position = 'relative';
          const childNodes = parent.childNodes;
          // if more than 2 children, 'best seller' is first childNode.
          if (childNodes.length > 2) {
            childNodes.forEach((el, i) => {
              if (i === 0) {
                el.style.flexBasis = 'min-content';
                el.style.position = 'absolute';
                el.style.top = '0';
                el.style.left = '0';
              }
              if (i === 1) el.style.flex = '0 0 25%';
              if (i === 2) el.style.flexBasis = 'auto';
            });
          } else {
            childNodes.forEach((el, i) => {
              if (i === 0) el.style.flex = '0 0 25%';
              if (i === 1) el.style.flexBasis = 'auto';
            });
          }
        } // end childNode styling.

        // Title -can be multiple h2.
        let text = '';
        el.querySelectorAll('h2').forEach((e) => {
          if (e) text += e.innerText?.trim()?.toLowerCase() + ' ';
        });
        const title = text.trim();
        // Price -two parts: whole and fraction.
        //    whole
        const whole = el.querySelector('.a-price-whole')?.innerText?.replace('\n.', '') ?? '0';
        //    fraction
        const fraction = el.querySelector('.a-price-fraction')?.innerText ?? '00';
        // price per count
        let pricePerCount = +el.querySelector('.a-text-price span')?.innerText?.replace('$', '') * 100 ?? 0;
        pricePerCount = Number.isNaN(pricePerCount) ? 0 : fixDecimal(pricePerCount);
        // fix price and attach to el.
        const price = +(whole + fraction) ?? 0;
        el.setAttribute('data-as-price-per-count', pricePerCount);
        el.setAttribute('data-as-price', price);
        // check if is a valid el.
        let isValid = false;
        // check if item is Ad, or price is zero.
        if (el.hasAttribute('data-component-id') && price > 0 && title) isValid = true;
        // style={display: none} should not be shown.
        if (el.style.display === 'none') isValid = false;
        // Hidden ad's have no 'data-component-id'
        if (el.classList.contains('AdHolder')) isValid = false;
        return {
          el,
          title,
          price,
          pricePerCount,
          isValid,
        };
      }
      function waitForSelector(selector) {
        return new Promise((resolve) => {
          // check if exist from start.
          if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
          }
          const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
              observer.disconnect();
              resolve(document.querySelector(selector));
            }
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
        });
      }

      // save pagination element
      function getPagination() {
        const pagination = document.querySelector('div[class*=pagination-container]');
        pagination.style.marginTop = '2rem';
        return pagination;
      }

      // VIEW -------------------------------------------------------------------------
      function sortResultsBox() {
        const sortResultsEl = document.createElement('div');
        sortResultsEl.id = 'sortResultsDiv';
        // sortResultsEl.style.marginBottom = '2rem';
        return sortResultsEl;
      }
      function getHeader(length) {
        const totalResultsEl = document.createElement('div');
        totalResultsEl.style.marginBottom = '2rem';
        totalResultsEl.style.marginTop = '2rem';
        totalResultsEl.style.textAlign = 'center';
        const totalResultsP = document.createElement('p');
        totalResultsP.innerText = `Total Search Result: ${length}`;
        totalResultsP.className = 'filterResults';
        totalResultsEl.appendChild(totalResultsP);
        return totalResultsEl;
      }
      function getFooter() {
        const footerDiv = document.createElement('div');
        // create end message.
        const P1 = document.createElement('p');
        P1.className = 'amazon-sort-end-message';
        P1.innerText = 'End Amazon Sort Results';
        footerDiv.appendChild(P1);

        // buttons wrapper div
        const btnWrapper = document.createElement('div');
        btnWrapper.style.display = 'flex';
        btnWrapper.style.justifyContent = 'center';
        // Create 'Go to top 👆' button.
        btnWrapper.appendChild(
          getFooterButton('Go to top 👆', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
        );
        // Add buttons to footer
        footerDiv.appendChild(btnWrapper);

        // original Amazon Page message.
        const P3 = document.createElement('p');
        P3.className = 'amazon-sort-end-message';
        P3.innerText = 'Original Amazon Page Results 👇';
        footerDiv.appendChild(P3);
        return footerDiv;
      }
      // footer button.
      function getFooterButton(text, fn) {
        const btn = document.createElement('button');
        btn.className = 'amazon-sort-btn';
        btn.onclick = fn;
        btn.innerText = text;
        btn.style.flex = '0 0 50%';
        return btn;
      }
      // Display the page currently loading.
      function loopText() {
        try {
          const loadingPageWrapper = document.createElement('div');
          loadingPageWrapper.id = 'amazon-sort-loading-wrapper';
          const loadingPageEl = document.createElement('p');
          loadingPageEl.className = 'filterResults';
          loadingPageWrapper.appendChild(loadingPageEl);
          // spinner
          const ring = document.createElement('div');
          ring.className = 'amazon-sort-lds-ring';
          const ringSegment1 = document.createElement('div');
          const ringSegment2 = document.createElement('div');
          const ringSegment3 = document.createElement('div');
          const ringSegment4 = document.createElement('div');
          ring.appendChild(ringSegment1);
          ring.appendChild(ringSegment2);
          ring.appendChild(ringSegment3);
          ring.appendChild(ringSegment4);
          loadingPageWrapper.appendChild(ring);
          return { loadingPageEl, loadingPageWrapper };
        } catch (e) {
          console.log(e);
        }
      }
    }

    function createForm(amazonFilterSort) {
      try {
        const form = document.createElement('form');
        form.id = 'amazon-sort-form-id';
        // contentDiv wraps Amazon Sort and wrapper
        const allContentDiv = document.createElement('div');
        allContentDiv.className = 'all-content-wrapper';
        // Amazon Sort paragraph
        const amazonSortPar = document.createElement('p');
        amazonSortPar.className = 'amazon-sort-name';
        amazonSortPar.innerText = 'Amazon Sort';
        allContentDiv.appendChild(amazonSortPar);

        // Wrap everything not AmazonSortPar
        const sortDiv = document.createElement('div');
        sortDiv.className = 'amazon-sort-search-btn-wrapper';

        // search pages div
        const searchDiv = document.createElement('div');
        searchDiv.className = 'amazon-sort-search-page-div';
        // search pages input label
        const searchInputLabel = document.createElement('label');
        searchInputLabel.htmlFor = 'amazon-sort-search-page-input-id';
        searchInputLabel.className = 'amazon-sort-search-page-label';
        searchInputLabel.innerText = 'SEARCH PAGES';
        // search pages input
        const searchInput = document.createElement('input');
        searchInput.id = 'amazon-sort-search-page-input-id';
        searchInput.className = 'amazon-sort-search-page-input';
        searchInput.type = 'number';
        searchInput.placeholder = '5';
        searchInput.min = '1';
        searchInput.max = '30';
        // add search page to form
        searchDiv.appendChild(searchInputLabel);
        searchDiv.appendChild(searchInput);
        // starting page text
        const startPage = document.createElement('p');
        startPage.style = 'margin: 0; font-size: small;';
        startPage.innerText = 'Starting from page ';
        const startPageSpan = document.createElement('span');
        startPageSpan.style = 'font-weight: bold';
        const pageNumber = new URLSearchParams(window.location.search).get('page') || '1';
        startPageSpan.innerText = pageNumber;
        startPage.appendChild(startPageSpan);
        searchDiv.appendChild(startPage);
        sortDiv.appendChild(searchDiv);

        // checkbox & button div
        const checkboxBtnDiv = document.createElement('div');
        checkboxBtnDiv.id = 'amazon-sort-checkbox-btn-id';
        // checkbox filter div
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'amazon-sort-checkbox-div';
        // checkbox filter
        const checkboxFilter = document.createElement('input');
        checkboxFilter.id = 'amazon-sort-checkbox-id';
        checkboxFilter.className = 'amazon-sort-checkbox';
        checkboxFilter.type = 'checkbox';
        checkboxFilter.checked = true;
        // checkbox filter label
        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = 'amazon-sort-checkbox-id';
        checkboxLabel.className = 'amazon-sort-checkbox-label';
        checkboxLabel.innerText = 'FILTER RESULTS?';
        // build checkbox
        checkboxDiv.appendChild(checkboxFilter);
        checkboxDiv.appendChild(checkboxLabel);
        checkboxBtnDiv.appendChild(checkboxDiv);

        // checkbox sort div
        const checkboxSortDiv = document.createElement('div');
        checkboxSortDiv.className = 'amazon-sort-checkbox-div';
        // checkbox Sort
        const checkboxSort = document.createElement('input');
        checkboxSort.id = 'amazon-sort-checkbox-ppc-id';
        checkboxSort.className = 'amazon-sort-checkbox';
        checkboxSort.type = 'checkbox';
        // checkbox Sort label
        const checkboxSortLabel = document.createElement('label');
        checkboxSortLabel.htmlFor = 'amazon-sort-checkbox-ppc-id';
        checkboxSortLabel.className = 'amazon-sort-checkbox-label';
        checkboxSortLabel.innerText = 'SORT BY COUNT?';
        // build checkbox sort
        checkboxSortDiv.appendChild(checkboxSort);
        checkboxSortDiv.appendChild(checkboxSortLabel);
        checkboxBtnDiv.appendChild(checkboxSortDiv);

        // btn
        const btn = document.createElement('button');
        btn.id = 'amazon-sort-btn-id';
        btn.className = 'amazon-sort-btn';
        btn.onclick = amazonFilterSort;
        btn.innerText = 'GO!';
        // add btn to div
        checkboxBtnDiv.appendChild(btn);
        // add checkbox & button div to form
        sortDiv.appendChild(checkboxBtnDiv);

        // Finish up
        allContentDiv.appendChild(sortDiv);
        // create watermark
        const webmastersmith = document.createElement('p');
        webmastersmith.className = 'amazon-sort-signature';
        webmastersmith.innerText = 'webmastersmith';

        allContentDiv.appendChild(webmastersmith);
        form.appendChild(allContentDiv);

        return { form, checkboxFilter, searchInput, checkboxSort, startPageSpan };
      } catch (e) {
        console.log('Could not create the form', e);
        return { form: null, checkbox: null, searchInput: null, checkboxSort: null, startPageSpan: null };
      }
    }
    function createStyleSheet() {
      try {
        const head = document.head || document.getElementsByTagName('head')[0];
        const style = document.createElement('style');
        head.appendChild(style);
        const textColor = '#03399e';
        const css = `
      :root {
        --amazon-sort-btn-background: #075ad3;
        --amazon-sort-btn-background-hover: #03399e;
        --amazon-sort-btn-shadow: #4892e0;
      }
  
      #amazon-sort-form-id {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding-bottom: 1rem !important;
        gap: 1.5rem !important;
        width: 100% !important;
        padding-top: 1rem !important;
        border: solid 1px rgba(0, 0, 0, 0.3) !important;
        border-radius: 5px !important;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19) !important;
      }
      .all-content-wrapper {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        padding-bottom: 0.5rem !important;
      }
      /* Search Pages */
      .amazon-sort-search-page-div {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 0.5rem !important;
      }
      .amazon-sort-search-btn-wrapper {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 1.5rem !important;
      }
      .amazon-sort-name {
        font-size: 3rem !important;
        color: var(--amazon-sort-btn-background-hover) !important;
        font-weight: bold !important;
        padding: 0 !important;
        margin: 0 !important;
        margin-bottom: 1rem !important;
      }
      .amazon-sort-search-page-input {
        font-size: 2rem !important;
        max-width: 140px !important;
        width: 100% !important;
        min-height: 2.6rem !important;
        color: var(--amazon-sort-btn-background) !important;
        text-align: center !important;
      }
      .amazon-sort-search-page-label {
        font-weight: bold !important;
      }
      /* Checkbox & Button */
      #amazon-sort-checkbox-btn-id {
      }
      /* Checkbox */
      .amazon-sort-checkbox-div {
        margin-bottom: 4px !important;
        display: flex !important;
        gap: 0.5rem !important;
      }
      .amazon-sort-checkbox {
      }
      .amazon-sort-checkbox-label {
        font-weight: bold !important;
      }
      /* Button */
      .amazon-sort-btn {
        font-size: 24px !important;
        text-align: center !important;
        width: 100% !important;
        height: 40px !important;
        cursor: pointer !important;
        outline: none !important;
        color: #fff !important;
        background-color: var(--amazon-sort-btn-background) !important;
        border: none !important;
        border-radius: 15px !important;
        box-shadow: 0 9px var(--amazon-sort-btn-shadow) !important;
      }
      .amazon-sort-btn:hover {
        background-color: var(--amazon-sort-btn-background-hover) !important;
        box-shadow: 0 9px var(--amazon-sort-btn-background) !important;
      }
      .amazon-sort-btn:active {
        background-color: var(--amazon-sort-btn-background-hover) !important;
        box-shadow: 0 5px var() !important;
        transform: translateY(4px) !important;
      }
  
      /* Start Loading Pages */
      #amazon-sort-loading-wrapper {
        position: relative !important;
        margin-top: 0.5rem !important;
        margin-bottom: 2rem !important;
      }
      .filterResults {
        display: inline !important;
        font-size: 3rem !important;
        color: var(--amazon-sort-btn-background-hover) !important;
        font-weight: bold !important;
        margin: 3rem 0 !important;
      }
      .amazon-sort-lds-ring {
        display: inline !important;
        position: absolute !important;
        top: -15px !important;
        left: 505px !important;
        width: 60px !important;
        height: 60px !important;
      }
      .amazon-sort-lds-ring div {
        box-sizing: border-box !important;
        display: block !important;
        position: absolute !important;
        width: 40px !important;
        height: 40px !important;
        margin: 8px !important;
        border: 8px solid var(--amazon-sort-btn-background-hover) !important;
        border-radius: 50% !important;
        animation: amazon-sort-lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite !important;
        border-color: var(--amazon-sort-btn-background-hover) transparent transparent transparent !important;
      }
      .amazon-sort-lds-ring div:nth-child(1) {
        animation-delay: -0.45s;
      }
      .amazon-sort-lds-ring div:nth-child(2) {
        animation-delay: -0.3s;
      }
      .amazon-sort-lds-ring div:nth-child(3) {
        animation-delay: -0.15s;
      }
      @keyframes amazon-sort-lds-ring {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      .amazon-sort-signature {
        position: absolute !important;
        bottom: -1rem !important;
        color: rgba(0, 0, 0, 0.2) !important;
        margin: 0 !important;
      }
      .amazon-sort-end-message {
        font-size: 3rem !important;
        color: var(--amazon-sort-btn-background-hover) !important;
        font-weight: bold !important;
        text-align: center !important;
        margin-top: 6rem !important;
        margin-bottom: 6rem !important;
      }

          `;
        style.appendChild(document.createTextNode(css));
        return head;
      } catch (e) {
        console.log(e);
        return null;
      }
    }
  } // end amazonFilterSort()
})();
