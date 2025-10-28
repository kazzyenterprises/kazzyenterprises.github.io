// shared/utils/js/orders-list-table.js
import { loadComponent } from '../component-loader.js'; 

class OrdersListTable {
  constructor(tableBodyId, onEdit, onDelete) {
    this.ordersTableBody = document.getElementById(tableBodyId);
    this.onEdit = onEdit;
    this.onDelete = onDelete;
  }

  _formatOrderDate(date) {
    if (!date) return 'N/A';
    const d = (typeof date.toDate === 'function') ? date.toDate() : new Date(date);
    return d.toISOString().split('T')[0];
  }

  render(orders = []) {
    if (!this.ordersTableBody) {
      console.error('Orders list tbody not found:', this.ordersTableBody);
      return;
    }
    this.ordersTableBody.innerHTML = '';

    orders.forEach(order => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${order.id}</td>
        <td>${this._formatOrderDate(order.orderDate)}</td>
        <td>${order.routeId || 'N/A'}</td>
        <td>${order.placeId || 'N/A'}</td>
        <td>${order.shopId || 'N/A'}</td>
        <td>${this._formatOrderDate(order.deliveryDate)}</td>
        <td>${order.status}</td>
        <td>₹${order.total?.toFixed(2) || '0.00'}</td>
        <td>
          <button class="edit-btn">✏️ Edit</button>
          <button class="delete-btn">🗑️ Delete</button>
        </td>`;
      this.ordersTableBody.appendChild(tr);

      tr.querySelector('.edit-btn').addEventListener('click', () => this.onEdit(order.id));
      tr.querySelector('.delete-btn').addEventListener('click', async () => {
        if (confirm(`Delete order ${order.id}?`)) await this.onDelete(order.id);
      });
    });
  }
}

export async function loadOrdersListTable(containerId, onEdit, onDelete) {
  const htmlPath = 'shared/components/order-list-table/orders-list-table-component.html';
  await loadComponent(htmlPath, containerId);
  return new OrdersListTable('orders-table-body', onEdit, onDelete);
}
