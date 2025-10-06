from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
import uuid

# -----------------------
# Flask App Configuration
# -----------------------
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Users/syedf/OneDrive - saveetha.com/Python/Restaurant_project/restaurant.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# -----------------------
# Database Models
# -----------------------
class Staff(db.Model):
    __tablename__ = "staff"
    staff_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.String(50), nullable=False, default="customer")  # default role: customer
    password = db.Column(db.String(255), nullable=False)


class MenuItem(db.Model):
    __tablename__ = "menu_items"
    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)  # Starter, Main, Dessert
    price = db.Column(db.Float, nullable=False)
    availability = db.Column(db.Boolean, default=True)


# -----------------------
# Create Tables Once
# -----------------------
with app.app_context():
    db.create_all()

# -----------------------
# Page Routes (Frontend)
# -----------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin_page():
    return render_template('admin.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/cart')
def cart():
    return render_template('cart.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')


# -----------------------
# API Routes (Backend)
# -----------------------

# ✅ Register API
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400

    # Check if email exists
    existing = Staff.query.filter_by(email=email).first()
    if existing:
        return jsonify({'message': 'Email already registered'}), 400

    new_user = Staff(name=name, email=email, phone=phone, password=password, role="customer")
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Registered successfully', 'token': f'token-{new_user.staff_id}'}), 200


# ✅ Login API (Updated for Admin/User Redirect)
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = Staff.query.filter_by(email=email, password=password).first()

    if not user:
        return jsonify({'ok': False, 'message': 'Invalid email or password'}), 401

    token = str(uuid.uuid4())

    # Redirect based on role
    if user.role.lower() == 'admin':
        redirect_url = url_for('admin_page')
    else:
        redirect_url = url_for('menu')

    return jsonify({
        'ok': True,
        'token': token,
        'role': user.role,
        'redirect_url': redirect_url
    })


# ✅ Menu API
@app.route('/api/menu', methods=['GET'])
def api_menu():
    items = MenuItem.query.all()
    menu = [
        {
            'item_id': item.item_id,
            'name': item.name,
            'description': item.description,
            'category': item.category,
            'price': item.price,
            'availability': item.availability
        } for item in items
    ]
    return jsonify(menu)


# ---------- ADD STAFF ----------
@app.route('/add_staff', methods=['POST'])
def add_staff():
    name = request.form['name']
    email = request.form['email']
    phone = request.form.get('phone')
    role = request.form['role']
    password = request.form['password']

    new_staff = Staff(name=name, email=email, phone=phone, role=role, password=password)
    db.session.add(new_staff)
    db.session.commit()

    return redirect(url_for('admin_page'))  # ✅ redirect back to admin page


# ---------- ADD MENU ITEM ----------
@app.route('/add_menu', methods=['POST'])
def add_menu():
    item_name = request.form['item_name']
    description = request.form.get('description')
    category = request.form['category']
    price = float(request.form['price'])
    availability = 'availability' in request.form  # checkbox returns True/False

    new_item = MenuItem(name=item_name, description=description, category=category,
                        price=price, availability=availability)
    db.session.add(new_item)
    db.session.commit()

    return redirect(url_for('admin_page'))  # ✅ redirect to admin page


# -----------------------
# Run App
# -----------------------
if __name__ == "__main__":
    app.run(debug=True)
