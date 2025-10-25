// shared/utils/js/order-item-table.js
import { loadComponent } from './component-loader.js';
//import { getProductsByCategory } from '../logic/store/data-store.js'; // optional, if you want product dropdowns

export class OrderItemTable {
  constructor(orderItemsBodyId, grandTotalId, addRowBtnId) {
    this.orderItemsBody = document.getElementById(orderItemsBodyId);
    this.grandTotal = document.getElementById(grandTotalId);
    this.addRowBtn = document.getElementById(addRowBtnId);
    this.items = [];

    if (this.addRowBtn) {
      this.addRowBtn.addEventListener('click', () => this.addEmptyRow());
    }
  }

  render(items = []) {
    if (!this.orderItemsBody) return console.error('Order items container not found');
    this.items = items;
    this._renderRows();
  }

  addEmptyRow() {
    const newItem = {
      productCategory: '',
      productName: '',
      orderQuantity: 1,
      sellingPrice: 0,
      mrp: 0
    };
    this.items.push(newItem);
    this._renderRows();
  }

  _renderRows() {
    this.orderItemsBody.innerHTML = '';
    this.items.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <input type="text" value="${item.productCategory || ''}" placeholder="Category">
        </td>
        <td>
          <input type="text" value="${item.productName || ''}" placeholder="Product">
        </td>
        <td>
          <input type="number" min="1" value="${item.orderQuantity || 1}">
        </td>
        <td>
          <input type="number" min="0" step="0.01" value="${item.sellingPrice || 0}">
        </td>
        <td>₹${item.mrp?.toFixed(2) || 0}</td>
        <td><button class="delete-row">🗑️</button></td>
      `;
      this.orderItemsBody.appendChild(tr);

      const inputs = tr.querySelectorAll('input');
      const qtyInput = inputs[2];
      const priceInput = inputs[3];

      const recalc = () => {
        item.productCategory = inputs[0].value;
        item.productName = inputs[1].value;
        item.orderQuantity = Number(qtyInput.value);
        item.sellingPrice = Number(priceInput.value);
        this._updateGrandTotal();
      };

      inputs[0].addEventListener('input', recalc);
      inputs[1].addEventListener('input', recalc);
      qtyInput.addEventListener('input', recalc);
      priceInput.addEventListener('input', recalc);

      tr.querySelector('.delete-row').addEventListener('click', () => {
        this.items.splice(idx, 1);
        this._renderRows();
      });
    });

    this._updateGrandTotal();
  }

  _updateGrandTotal() {
    const total = this.items.reduce((sum, item) => {
      return sum + ((item.orderQuantity || 0) * (item.sellingPrice || 0));
    }, 0);
    if (this.grandTotal) this.grandTotal.textContent = `Total: ₹${total.toFixed(2)}`;
  }
}

export async function loadOrderItemTable(containerId) {
  const htmlPath = 'shared/utils/templates/order-item-table.html';
  await loadComponent(htmlPath, containerId);
  return new OrderItemTable('order-items-body', 'grand-total', 'add-product-row');
}

