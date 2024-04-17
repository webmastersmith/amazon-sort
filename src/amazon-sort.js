// about:debugging#/runtime/this-firefox
// chrome://extensions/
// https://codebeautify.org/minify-js#
// Start: get 'parent' children, extract info and attach as object.
// loop through pages.
// filter, sort, remove old children, replace with new children.
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
    // get parent node.
    function getParent(doc) {
      return doc.querySelector('div[id*=skipLinkTargetForMainSearchResults] + span');
    }
    const parent = getParent(document);
    if (!parent) throw new Error('Could not get Parent node.');
    // Insert Form
    parent.insertBefore(form, parent.firstChild);

    // When 'GO!' btn clicked, this function runs. The Main Logic. All code inside this function.
    async function amazonFilterSort() {
      // All Valid Items HERE.
      const items = [];
      // Create the Loading Page Element.
      // const parent = getParent(document);
      const { loadingPageEl, loadingPageWrapper } = loopText();

      // form button clicked, remove form from page.
      form.remove();
      // Raw JS handles already exist. Get values from the form.
      const filterTitle = checkboxFilter.checked; // true is filter
      const pages = +searchInput.value || 5;
      const sortByPricePerCount = checkboxSort.checked;

      // START -Loop through pages, add items to memory.
      for (let i = 1; i <= pages; i++) {
        // display the page thats currently loading.
        loadingPageEl.innerText = `Page ${i} of ${pages} loading`;
        parent.insertBefore(loadingPageWrapper, parent.firstChild);

        items.push(getItems(filterTitle));
        // click next page
        const nextBtn = document.querySelector('a[class*=pagination-next]');
        // if next page doesn't exist, don't click.
        if (!nextBtn) break;
        // don't click last page
        if (i < pages) {
          nextBtn.click();
          await sleep(3000);
        }
      } // end for loop
      // Remove the 'Page loading' div.
      loadingPageWrapper.remove();
      // Sort Items.
      const sortedItems = priceSort(items.flat(), sortByPricePerCount ? 'pricePerCount' : 'price');
      // create Total Result element w/ styling
      const finalEl = finalResultEl(sortedItems);
      // Get pagination w/ styling
      const paginationEl = getPagination();
      // Remove all Items and replace with items in memory.
      await replaceParentItems(parent, sortedItems);
      parent.before(finalEl);
      parent.after(paginationEl);

      // FUNCTIONS ----------------------------------------------------------------------------
      function priceSort(itemArr, key) {
        const blob = itemArr.toSorted((a, b) => a[key] - b[key]);
        return blob.map((item) => item.el);
      }

      async function replaceParentItems(parent, items) {
        // clear parent
        while (parent.firstChild) {
          parent.removeChild(parent.lastChild);
        }
        // add items back
        items.forEach((item) => {
          parent.appendChild(item);
        });

        return;
      }

      // get items
      function getItems(isFilter) {
        // keywords and item.title have all been lowerCased.
        return [...document.querySelectorAll('div[class*=main-slot] div[data-uuid]')]
          .map((item) => extractListingFromItem(item))
          .filter((item) => item.isValid)
          .filter((item) => (isFilter ? keywords.every((key) => item.title.includes(key)) : true));

        // const boxes = [...document.querySelectorAll('div[class*=main-slot] div[data-uuid]')];
        // console.log('boxes', boxes);
        // const tempMap = boxes.map((item) => extractListingFromItem(item));
        // console.log('tempMap', tempMap);
        // const tempFilter = tempMap.filter((item) => item.isValid);
        // console.log('tempfilter', tempFilter);
        // const tempKeyword = tempFilter.filter((item) => keyword.every((key) => item.title.includes(key)));
        // console.log('tempKeyword', tempKeyword);
        // return tempKeyword;
      }

      function extractListingFromItem(el) {
        // Title
        const title = el.querySelector('h2')?.innerText?.trim()?.toLowerCase();
        // Price
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
        // price and pricePerCount is in hundreds.
        return {
          el,
          title,
          price,
          pricePerCount,
          isValid,
        };
      }

      // VIEW -------------------------------------------------------------------------
      function finalResultEl(arr) {
        const totalResultsEl = document.createElement('div');
        totalResultsEl.style.marginBottom = '2rem';
        const totalResultsP = document.createElement('p');
        totalResultsP.innerText = `Total Search Result: ${arr.length}`;
        totalResultsP.className = 'filterResults';
        totalResultsEl.appendChild(totalResultsP);
        return totalResultsEl;
      }
      // save pagination element
      function getPagination() {
        const pagination = document.querySelector('div[class*=pagination-container]');
        pagination.style.marginTop = '2rem';
        pagination.style.clear = 'both';
        pagination.style.display = 'flex';
        return pagination;
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
