/**
 * RenoBudget - Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Save the project (Ctrl+S or Cmd+S)
 * 5. Click Deploy → New Deployment
 * 6. Select "Web app" as the type
 * 7. Set "Execute as" to "Me"
 * 8. Set "Who has access" to "Anyone"
 * 9. Click Deploy and authorize the app
 * 10. Copy the Web App URL and paste it in RenoBudget settings
 */

// Sheet names
const SHEETS = {
  EXPENSES: 'Expenses',
  BUDGETS: 'Budgets', 
  CATEGORIES: 'Categories',
  USERS: 'Users',
  ACTIVITY_LOG: 'ActivityLog',
  SETTINGS: 'Settings'
};

// Initialize sheets if they don't exist
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Expenses sheet
  let expensesSheet = ss.getSheetByName(SHEETS.EXPENSES);
  if (!expensesSheet) {
    expensesSheet = ss.insertSheet(SHEETS.EXPENSES);
    expensesSheet.appendRow([
      'id', 'category', 'subcategory', 'amount', 'description', 
      'date', 'paidBy', 'createdBy', 'createdOn', 'modifiedOn', 
      'isDeleted', 'syncStatus'
    ]);
    expensesSheet.getRange(1, 1, 1, 12).setFontWeight('bold');
  }
  
  // Budgets sheet
  let budgetsSheet = ss.getSheetByName(SHEETS.BUDGETS);
  if (!budgetsSheet) {
    budgetsSheet = ss.insertSheet(SHEETS.BUDGETS);
    budgetsSheet.appendRow([
      'id', 'category', 'subcategory', 'budgetAmount', 'modifiedOn', 'syncStatus'
    ]);
    budgetsSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  
  // Categories sheet
  let categoriesSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!categoriesSheet) {
    categoriesSheet = ss.insertSheet(SHEETS.CATEGORIES);
    categoriesSheet.appendRow(['name', 'subcategories', 'color']);
    categoriesSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    
    // Add default categories
    const defaultCategories = [
      ['Kitchen', 'Tiles,Cabinets,Sink,Plumbing,Appliances,Countertop,Other', '#3B82F6'],
      ['Bathroom', 'Tiles,Shower,Plumbing,Mirror,Vanity,Toilet,Other', '#06B6D4'],
      ['Electrical', 'Wiring,Switches,Lights,Fan,MCB Panel,Other', '#F59E0B'],
      ['Furniture', 'Sofa,Dining,Wardrobe,Bed,Study Table,TV Unit,Other', '#8B5CF6'],
      ['Painting', 'Labour,Paint,Primer,Putty,Texture,Other', '#EC4899'],
      ['Flooring', 'Tiles,Marble,Wood,Vinyl,Labour,Other', '#10B981'],
      ['Civil Work', 'Demolition,Masonry,Plastering,Waterproofing,Other', '#EF4444'],
      ['Doors & Windows', 'Main Door,Room Doors,Windows,Hardware,Glass,Other', '#F97316'],
      ['Miscellaneous', 'Transport,Cleaning,Supervision,Tips,Other', '#6B7280']
    ];
    defaultCategories.forEach(row => categoriesSheet.appendRow(row));
  }
  
  // Users sheet
  let usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(SHEETS.USERS);
    usersSheet.appendRow(['id', 'email', 'name', 'role', 'lastLogin']);
    usersSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  
  // Activity Log sheet
  let activitySheet = ss.getSheetByName(SHEETS.ACTIVITY_LOG);
  if (!activitySheet) {
    activitySheet = ss.insertSheet(SHEETS.ACTIVITY_LOG);
    activitySheet.appendRow([
      'id', 'action', 'entityType', 'entityId', 'description', 'userId', 'timestamp'
    ]);
    activitySheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  
  // Settings sheet
  let settingsSheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEETS.SETTINGS);
    settingsSheet.appendRow(['key', 'value']);
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    settingsSheet.appendRow(['projectName', 'Home Renovation']);
    settingsSheet.appendRow(['currency', 'INR']);
    settingsSheet.appendRow(['lastSync', '']);
  }
  
  return ss;
}

// Handle POST requests
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    // Initialize sheets on first request
    initializeSheets();
    
    let result;
    
    switch (action) {
      case 'fetchAll':
        result = fetchAllData(data);
        break;
      case 'fullSync':
        result = fullSync(data);
        break;
      case 'syncExpenses':
        result = syncExpenses(data.expenses);
        break;
      case 'syncBudgets':
        result = syncBudgets(data.budgets);
        break;
      case 'syncCategories':
        result = syncCategories(data.categories);
        break;
      case 'addExpense':
        result = addExpense(data.expense);
        break;
      case 'updateExpense':
        result = updateExpense(data.expense);
        break;
      case 'deleteExpense':
        result = deleteExpense(data.expenseId);
        break;
      case 'saveBudget':
        result = saveBudget(data.budget);
        break;
      case 'deleteBudget':
        result = deleteBudget(data.budgetId);
        break;
      case 'logActivity':
        result = logActivity(data.activity, data.userId);
        break;
      case 'quickSync':
        result = quickSync(data);
        break;
      default:
        result = { success: false, message: 'Unknown action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.message,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  initializeSheets();
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'RenoBudget API is running',
    version: '1.0.0'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Fetch all data from sheets
function fetchAllData(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get expenses
  const expensesSheet = ss.getSheetByName(SHEETS.EXPENSES);
  const expenses = sheetToObjects(expensesSheet);
  
  // Get budgets
  const budgetsSheet = ss.getSheetByName(SHEETS.BUDGETS);
  const budgets = sheetToObjects(budgetsSheet);
  
  // Get categories
  const categoriesSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  const categoriesRaw = sheetToObjects(categoriesSheet);
  const categories = categoriesRaw.map(c => ({
    name: c.name,
    subcategories: c.subcategories ? c.subcategories.split(',') : [],
    color: c.color
  }));
  
  // Update last sync
  updateSetting('lastSync', new Date().toISOString());
  
  return {
    success: true,
    message: 'Data fetched successfully',
    data: {
      expenses: expenses,
      budgets: budgets,
      categories: categories,
      lastSync: new Date().toISOString()
    }
  };
}

// Full sync - merge local and remote data
function fullSync(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lastSyncTime = data.lastSyncTime ? new Date(data.lastSyncTime) : null;
  
  // Sync expenses
  if (data.expenses && data.expenses.length > 0) {
    const pendingExpenses = data.expenses.filter(e => e.syncStatus === 'pending');
    if (pendingExpenses.length > 0) {
      syncExpenses(pendingExpenses);
    }
  }
  
  // Sync budgets
  if (data.budgets && data.budgets.length > 0) {
    const pendingBudgets = data.budgets.filter(b => b.syncStatus === 'pending');
    if (pendingBudgets.length > 0) {
      syncBudgets(pendingBudgets);
    }
  }
  
  // Sync categories
  if (data.categories && data.categories.length > 0) {
    syncCategories(data.categories);
  }
  
  // Fetch latest data
  return fetchAllData(data);
}

// Sync expenses to sheet
function syncExpenses(expenses) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.EXPENSES);
  
  expenses.forEach(expense => {
    const rowIndex = findRowById(sheet, expense.id);
    const rowData = [
      expense.id,
      expense.category,
      expense.subcategory,
      expense.amount,
      expense.description || '',
      expense.date,
      expense.paidBy || '',
      expense.createdBy || '',
      expense.createdOn,
      expense.modifiedOn,
      expense.isDeleted ? 'TRUE' : 'FALSE',
      'synced'
    ];
    
    if (rowIndex > 0) {
      // Update existing row
      sheet.getRange(rowIndex, 1, 1, 12).setValues([rowData]);
    } else {
      // Add new row
      sheet.appendRow(rowData);
    }
  });
  
  return { success: true, message: 'Expenses synced' };
}

// Sync budgets to sheet
function syncBudgets(budgets) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.BUDGETS);
  
  budgets.forEach(budget => {
    const rowIndex = findRowById(sheet, budget.id);
    const rowData = [
      budget.id,
      budget.category,
      budget.subcategory || '',
      budget.budgetAmount,
      budget.modifiedOn,
      'synced'
    ];
    
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, 6).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
  });
  
  return { success: true, message: 'Budgets synced' };
}

// Sync categories to sheet
function syncCategories(categories) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  
  // Clear existing data (except header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // Add categories
  categories.forEach(cat => {
    const subcategories = Array.isArray(cat.subcategories) 
      ? cat.subcategories.join(',') 
      : cat.subcategories;
    sheet.appendRow([cat.name, subcategories, cat.color || '#6B7280']);
  });
  
  return { success: true, message: 'Categories synced' };
}

// Add single expense
function addExpense(expense) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.EXPENSES);
  
  sheet.appendRow([
    expense.id,
    expense.category,
    expense.subcategory,
    expense.amount,
    expense.description || '',
    expense.date,
    expense.paidBy || '',
    expense.createdBy || '',
    expense.createdOn,
    expense.modifiedOn,
    'FALSE',
    'synced'
  ]);
  
  return { success: true, message: 'Expense added' };
}

// Update expense
function updateExpense(expense) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.EXPENSES);
  const rowIndex = findRowById(sheet, expense.id);
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 12).setValues([[
      expense.id,
      expense.category,
      expense.subcategory,
      expense.amount,
      expense.description || '',
      expense.date,
      expense.paidBy || '',
      expense.createdBy || '',
      expense.createdOn,
      expense.modifiedOn,
      expense.isDeleted ? 'TRUE' : 'FALSE',
      'synced'
    ]]);
    return { success: true, message: 'Expense updated' };
  }
  
  return { success: false, message: 'Expense not found' };
}

// Delete expense (soft delete)
function deleteExpense(expenseId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.EXPENSES);
  const rowIndex = findRowById(sheet, expenseId);
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 10).setValue(new Date().toISOString()); // modifiedOn
    sheet.getRange(rowIndex, 11).setValue('TRUE'); // isDeleted
    return { success: true, message: 'Expense deleted' };
  }
  
  return { success: false, message: 'Expense not found' };
}

// Save budget
function saveBudget(budget) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.BUDGETS);
  const rowIndex = findRowById(sheet, budget.id);
  
  const rowData = [
    budget.id,
    budget.category,
    budget.subcategory || '',
    budget.budgetAmount,
    budget.modifiedOn,
    'synced'
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 6).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return { success: true, message: 'Budget saved' };
}

// Delete budget
function deleteBudget(budgetId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.BUDGETS);
  const rowIndex = findRowById(sheet, budgetId);
  
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'Budget deleted' };
  }
  
  return { success: false, message: 'Budget not found' };
}

// Log activity
function logActivity(activity, userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.ACTIVITY_LOG);
  
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    activity.action,
    activity.entityType,
    activity.entityId,
    activity.description,
    userId || '',
    new Date().toISOString()
  ]);
  
  return { success: true, message: 'Activity logged' };
}

// Quick sync (for beforeunload)
function quickSync(data) {
  if (data.expenses && data.expenses.length > 0) {
    syncExpenses(data.expenses);
  }
  if (data.budgets && data.budgets.length > 0) {
    syncBudgets(data.budgets);
  }
  return { success: true, message: 'Quick sync complete' };
}

// Helper: Convert sheet data to array of objects
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  const objects = [];
  
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let value = data[i][j];
      // Convert TRUE/FALSE strings to booleans
      if (value === 'TRUE') value = true;
      else if (value === 'FALSE') value = false;
      // Convert numbers
      else if (headers[j] === 'amount' || headers[j] === 'budgetAmount') {
        value = Number(value) || 0;
      }
      obj[headers[j]] = value;
    }
    objects.push(obj);
  }
  
  return objects;
}

// Helper: Find row index by ID
function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return i + 1; // 1-indexed
    }
  }
  return -1;
}

// Helper: Update setting
function updateSetting(key, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  
  // Key not found, add new row
  sheet.appendRow([key, value]);
}

// Helper: Get setting
function getSetting(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  
  return null;
}

// Test function
function testSetup() {
  initializeSheets();
  Logger.log('Sheets initialized successfully!');
}
