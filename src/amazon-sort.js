// about:debugging#/runtime/this-firefox
// chrome://extensions/
// https://codebeautify.org/minify-js#
// show page your search is currently on: const urlParams = new URLSearchParams(window.location.search)
// urlParams.get('page') // "7"
(async function () {
  // only run function if amazon search page.
  if (/amazon.*\/s\?/i.test(location.href)) {
    function getKeyword() {
      try {
        const keyword = document.getElementById('twotabsearchtextbox').value.trim().toLowerCase().split(' ');
        console.log('Search Term: ', keyword);
        return keyword;
      } catch (e) {
        console.log('getKeyword problem: ', e);
        return [];
      }
    }
    function getParent() {
      try {
        const parent = document.querySelector(
          '#s-skipLinkTargetForMainSearchResults + span > div.s-main-slot'
        );
        return parent;
      } catch (e) {
        console.error(e);
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
    function createForm() {
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
        const checkbox = document.createElement('input');
        checkbox.id = 'amazon-sort-checkbox-id';
        checkbox.className = 'amazon-sort-checkbox';
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        // checkbox filter label
        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = 'amazon-sort-checkbox-id';
        checkboxLabel.className = 'amazon-sort-checkbox-label';
        checkboxLabel.innerText = 'FILTER RESULTS?';
        // build checkbox
        checkboxDiv.appendChild(checkbox);
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

        return { form, checkbox, searchInput, checkboxSort, startPageSpan };
      } catch (e) {
        console.log('Could not create the form', e);
        return { form: null, checkbox: null, searchInput: null, checkboxSort: null, startPageSpan: null };
      }
    }
    function loopText() {
      try {
        const wrapper = document.createElement('div');
        wrapper.id = 'amazon-sort-loading-wrapper';
        const feedback = document.createElement('p');
        feedback.className = 'filterResults';
        wrapper.appendChild(feedback);
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
        wrapper.appendChild(ring);
        return { feedback, wrapper };
      } catch (e) {
        console.log(e);
      }
    }

    // create the script tags.
    const keyword = getKeyword();
    // get parent node.
    const parent = getParent();
    if (!parent) throw new Error('Could not get Parent node.');
    // Create styles
    const head = createStyleSheet();
    if (!head) throw new Error('Could not attach style sheet.');
    // Create form and content
    const { form, checkbox, searchInput, checkboxSort, startPageSpan } = createForm();
    if (!form) throw new Error('Could not create form.');
    // Insert Form
    parent.insertBefore(form, parent.firstChild);
    // all code inside this function.
    async function amazonFilterSort() {
      // button clicked, remove it.
      form.remove();
      let items = [];
      // values from input box
      const filterItems = checkbox.checked; // true is filter
      const pages = +searchInput.value || 5;
      const sortByPricePerCount = checkboxSort.checked;
      // console.log(filterItems, pages, sortByPricePerCount);

      // Get Items from page.
      async function getItems(pageNumber) {
        let itemArr = [];
        return new Promise((res, rej) => {
          window.requestIdleCallback(
            () => {
              try {
                itemArr = [...document.querySelectorAll('.s-asin[data-cel-widget*=search_result]')];
                console.log(`Page ${pageNumber} first query match:  ${itemArr.length}`);
                if (itemArr.length < 1) {
                  itemArr = [...document.querySelectorAll('.s-asin > div.sg-col-inner')];
                  console.log(`Page ${pageNumber} second query match:  ${itemArr.length}`);
                }
              } catch (e) {}
              // add to items array.
              itemArr.forEach((el) => {
                items.push(el);
              });
              res();
            },
            { timeout: 5000 }
          );
        });
      } // end getItems()

      // sort the items by price
      function mySort(newItems) {
        // add pagination button back into page after removing unwanted results.
        let pagination = '';
        try {
          pagination = document.querySelector(
            'div.s-main-slot div[cel_widget_id^="MAIN-PAGINATION"]'
          ).parentNode;
        } catch (e) {
          // do nothing
        }
        // sort newItems in-place.
        newItems.sort((elemA, elemB) => {
          let a = 0,
            b = 0;
          // sort by price per count?
          if (sortByPricePerCount) {
            a = parseFloat(elemA.dataset.pricepercount);
            b = parseFloat(elemB.dataset.pricepercount);
            // console.log(a, b);
            // sort by price
          } else {
            a = +elemA.dataset.price;
            b = +elemB.dataset.price;
          }
          // console.log(a, b);
          return a < b ? -1 : a > b ? 1 : 0;
        });

        // create Total Result element
        const p = document.createElement('p');
        p.innerText = `Total Search Result: ${newItems.length}`;
        p.className = 'filterResults';
        // console.log('Total Results: ', newItems.length);

        // add sorted newItems to page.
        return [p, ...newItems, pagination];
        // console.log('after pagination', items);
      }
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // click page and wait for page to load.
      async function clickPage(pageNumber) {
        try {
          document.querySelector(`span.s-pagination-strip > a.s-pagination-next`).click();
          await sleep(2000);
        } catch (e) {
          return false;
        }
        return true;
      }
      // check title and Price
      async function checkTitlePrice(nodes) {
        // get title
        return nodes.reduce((acc, el, idx) => {
          let title = '';
          let price = 0;
          let pricePerCount = 0;
          try {
            // return early if title or price not exist
            title = el.querySelector('h2 > a > span').innerText.trim().toLowerCase() || '';
            if (!title) return acc;
            price = +el.querySelector('span.a-price-whole').innerText.replaceAll(/\W+/g, '') || 0;
            if (!price) return acc;
            pricePerCount = price;

            // set price per count if it exist
            try {
              // ppc sometimes null.
              const count = el.querySelector('.a-price + span').innerText;
              if (/\d/.test(count)) {
                pricePerCount = count.match(/\d|\./g).join('');
              }
            } catch (e) {
              // do nothing
            }
            // main price or PPC.
            el.setAttribute('data-pricepercount', pricePerCount);

            // check title if filterItems = true.
            // console.log('filter: ', filterItems);
            if (filterItems && keyword.length > 0) {
              if (keyword.every((key) => title.includes(key))) {
                // el.setAttribute('data-title', title);
                el.setAttribute('data-price', price);
                acc.push(el);
                // console.log(acc);
                return acc;
              }
              return acc;
            }
            // no filter or keyword empty.
            el.setAttribute('data-price', price);
            acc.push(el);
            return acc;
          } catch (e) {
            return acc;
          }
        }, []);
      }

      async function replaceParentItems(newItems) {
        // clear parent
        while (parent.firstChild) {
          parent.removeChild(parent.lastChild);
        }
        // add items back
        newItems.forEach((item) => {
          parent.appendChild(item);
        });

        return;
      }
      // loop through pages
      const { feedback, wrapper } = loopText();

      for (let i = 1; i <= pages; i++) {
        // create feedback
        feedback.innerText = `Page ${i} of ${pages} loading`;
        parent.insertBefore(wrapper, parent.firstChild);

        // start the process
        await getItems(i);
        // no need to click page, if only getting 1 page.
        if (i < pages) {
          // if exist returns false, there are no other results. end loop.
          const exist = await clickPage(i);
          if (exist === false) break;
        }
      }
      wrapper.remove();
      const filteredItems = await checkTitlePrice(items);
      const sortedItems = mySort(filteredItems);
      await replaceParentItems(sortedItems);
    } // end amazonFilterSort()
  } // end if
})();
