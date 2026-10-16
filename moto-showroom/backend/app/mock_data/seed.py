"""Initial DEMONSTRATION data.

Every brand, model, specification, customer, phone number, chassis/engine
number and transaction below is fictional. Model names are invented and
specifications are illustrative only – they do not describe real products.
Dates are generated relative to "today" so dashboards always look current.
"""
import hashlib
import random
from datetime import date, datetime, time, timedelta, timezone

IMG = "https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=1400&q=80"

IMAGE_POOLS = {
    "sports": ["1558981403-c5f9899a28bc", "1609630875171-b1321377ee65", "1591637333184-19aa84b3e01f"],
    "standard": ["1568772585407-9361f9bf3a87", "1622185135505-2d795003994a", "1449426468159-d96dbf08f19f"],
    "cruiser": ["1547549082-6bc09f2049ae", "1525160354320-d8e92641c563", "1558980664-769d59546b3d"],
    "commuter": ["1622185135505-2d795003994a", "1568772585407-9361f9bf3a87", "1449426468159-d96dbf08f19f"],
    "scooter": ["1517846693594-1567da72af75", "1568772585407-9361f9bf3a87", "1622185135505-2d795003994a"],
    "electric": ["1591637333184-19aa84b3e01f", "1609630875171-b1321377ee65", "1558981403-c5f9899a28bc"],
    "offroad": ["1449426468159-d96dbf08f19f", "1558980664-769d59546b3d", "1525160354320-d8e92641c563"],
    "touring": ["1525160354320-d8e92641c563", "1547549082-6bc09f2049ae", "1558980664-769d59546b3d"],
}


def img(pool: str, i: int = 0) -> str:
    ids = IMAGE_POOLS[pool]
    return IMG.format(id=ids[i % len(ids)])


def gallery_for(pool: str, offset: int) -> list[str]:
    ids = IMAGE_POOLS[pool]
    return [IMG.format(id=ids[(offset + k) % len(ids)]) for k in range(len(ids))]


def _ts(d: date, hour: int = 11, minute: int = 0) -> str:
    return datetime.combine(d, time(hour, minute), tzinfo=timezone.utc).isoformat()


def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


CATEGORIES = [
    ("Sports Bikes", "sports", "Aggressive styling, sharp handling and high-revving engines.", "sports"),
    ("Commuter Bikes", "commuter", "Economical, reliable everyday motorcycles for city rides.", "commuter"),
    ("Standard Motorcycles", "standard", "Upright, versatile naked bikes for every kind of rider.", "standard"),
    ("Cruisers", "cruiser", "Low-slung, relaxed riding with big torque and bold presence.", "cruiser"),
    ("Touring Motorcycles", "touring", "Comfort and luggage capacity built for long distances.", "touring"),
    ("Scooters", "scooter", "Automatic, practical and easy to ride through traffic.", "scooter"),
    ("Scooties", "scooty", "Lightweight, low-seat scooties ideal for short city trips.", "scooter"),
    ("Electric Bikes", "electric", "Zero-emission electric two-wheelers with low running costs.", "electric"),
    ("Off-Road Motorcycles", "off-road", "Long-travel suspension and knobby tyres for the trail.", "offroad"),
    ("Used Motorcycles", "used", "Inspected pre-owned motorcycles at great value.", "standard"),
]

BRANDS = [
    ("Apex Moto", "Performance-focused sports and naked motorcycles.", "#ef4444"),
    ("Raptor Motors", "Street and sports machines with an aggressive character.", "#f97316"),
    ("Nomad Cruisers", "Heritage-styled cruisers and long-distance tourers.", "#a16207"),
    ("Urban Glide", "Practical automatic scooters and scooties.", "#0ea5e9"),
    ("Voltra Electric", "Modern electric bikes and e-scooters.", "#22c55e"),
    ("Kestrel Bikes", "Dependable commuter and standard motorcycles.", "#8b5cf6"),
    ("Trailhawk", "Dirt, enduro and adventure-ready off-roaders.", "#eab308"),
    ("Metro Ride", "Budget-friendly everyday commuters.", "#64748b"),
]

# name, brand, category slug, cc, fuel, transmission, price, year, condition, listing, featured, power, mileage
BIKES = [
    ("Apex RX 250", "Apex Moto", "sports", 250, "Petrol", "6-Speed Manual", 1150000, 2026, "new", "active", True, "26 hp (demo)", "32 km/l (demo)"),
    ("Apex RX 400", "Apex Moto", "sports", 399, "Petrol", "6-Speed Manual", 1890000, 2026, "new", "active", True, "44 hp (demo)", "26 km/l (demo)"),
    ("Raptor Strike 200", "Raptor Motors", "sports", 199, "Petrol", "6-Speed Manual", 765000, 2026, "new", "active", False, "24 hp (demo)", "35 km/l (demo)"),
    ("Raptor Strike 650", "Raptor Motors", "sports", 649, "Petrol", "6-Speed Manual", 4250000, 2026, "new", "active", True, "68 hp (demo)", "20 km/l (demo)"),
    ("Metro Ride CD 70", "Metro Ride", "commuter", 70, "Petrol", "4-Speed Manual", 158000, 2026, "new", "active", False, "5.5 hp (demo)", "55 km/l (demo)"),
    ("Metro Ride Pride 100", "Metro Ride", "commuter", 100, "Petrol", "4-Speed Manual", 189000, 2026, "new", "active", False, "7.5 hp (demo)", "50 km/l (demo)"),
    ("Metro Ride Star 110", "Metro Ride", "commuter", 110, "Petrol", "4-Speed Manual", 214000, 2026, "new", "active", False, "8 hp (demo)", "48 km/l (demo)"),
    ("Kestrel K125", "Kestrel Bikes", "commuter", 125, "Petrol", "5-Speed Manual", 262000, 2026, "new", "active", True, "11 hp (demo)", "42 km/l (demo)"),
    ("Kestrel K125 Deluxe", "Kestrel Bikes", "commuter", 125, "Petrol", "5-Speed Manual", 298000, 2026, "new", "active", False, "11 hp (demo)", "41 km/l (demo)"),
    ("Kestrel Street 150", "Kestrel Bikes", "standard", 150, "Petrol", "5-Speed Manual", 445000, 2026, "new", "active", False, "14 hp (demo)", "38 km/l (demo)"),
    ("Apex Naked 300", "Apex Moto", "standard", 300, "Petrol", "6-Speed Manual", 1390000, 2026, "new", "active", True, "30 hp (demo)", "28 km/l (demo)"),
    ("Raptor Roadster 250", "Raptor Motors", "standard", 249, "Petrol", "6-Speed Manual", 940000, 2025, "new", "active", False, "25 hp (demo)", "30 km/l (demo)"),
    ("Nomad Drifter 350", "Nomad Cruisers", "cruiser", 349, "Petrol", "5-Speed Manual", 1680000, 2026, "new", "active", True, "20 hp (demo)", "30 km/l (demo)"),
    ("Nomad Highway 500", "Nomad Cruisers", "cruiser", 499, "Petrol", "6-Speed Manual", 2450000, 2026, "new", "active", False, "36 hp (demo)", "24 km/l (demo)"),
    ("Nomad Classic 650", "Nomad Cruisers", "cruiser", 648, "Petrol", "6-Speed Manual", 3550000, 2026, "new", "active", False, "47 hp (demo)", "21 km/l (demo)"),
    ("Nomad Voyager 750", "Nomad Cruisers", "touring", 749, "Petrol", "6-Speed Manual", 4890000, 2026, "new", "active", True, "58 hp (demo)", "19 km/l (demo)"),
    ("Apex Tourer 400", "Apex Moto", "touring", 399, "Petrol", "6-Speed Manual", 2150000, 2026, "new", "active", False, "40 hp (demo)", "25 km/l (demo)"),
    ("Urban Glide Cruze 125", "Urban Glide", "scooter", 125, "Petrol", "CVT Automatic", 395000, 2026, "new", "active", True, "9 hp (demo)", "45 km/l (demo)"),
    ("Urban Glide Maxi 150", "Urban Glide", "scooter", 150, "Petrol", "CVT Automatic", 520000, 2026, "new", "active", False, "12 hp (demo)", "40 km/l (demo)"),
    ("Urban Glide Pixie 50", "Urban Glide", "scooty", 50, "Petrol", "CVT Automatic", 189000, 2026, "new", "active", False, "3.5 hp (demo)", "60 km/l (demo)"),
    ("Urban Glide Lumi 70", "Urban Glide", "scooty", 70, "Petrol", "CVT Automatic", 226000, 2026, "new", "active", False, "4.5 hp (demo)", "55 km/l (demo)"),
    ("Voltra Spark E1", "Voltra Electric", "electric", 0, "Electric", "Single-Speed Automatic", 235000, 2026, "new", "active", True, "1.2 kW (demo)", "70 km range (demo)"),
    ("Voltra Pulse E3", "Voltra Electric", "electric", 0, "Electric", "Single-Speed Automatic", 349000, 2026, "new", "active", False, "2.5 kW (demo)", "95 km range (demo)"),
    ("Voltra Bolt E-Moto", "Voltra Electric", "electric", 0, "Electric", "Single-Speed Automatic", 690000, 2026, "new", "active", True, "6 kW (demo)", "130 km range (demo)"),
    ("Voltra Nova E7", "Voltra Electric", "electric", 0, "Electric", "Single-Speed Automatic", 985000, 2027, "new", "upcoming", False, "9 kW (demo)", "180 km range (demo)"),
    ("Trailhawk TX 150", "Trailhawk", "off-road", 149, "Petrol", "5-Speed Manual", 540000, 2026, "new", "active", False, "13 hp (demo)", "35 km/l (demo)"),
    ("Trailhawk Enduro 250", "Trailhawk", "off-road", 249, "Petrol", "6-Speed Manual", 1250000, 2026, "new", "active", True, "23 hp (demo)", "28 km/l (demo)"),
    ("Kestrel K100 Classic", "Kestrel Bikes", "commuter", 100, "Petrol", "4-Speed Manual", 175000, 2023, "new", "discontinued", False, "7 hp (demo)", "50 km/l (demo)"),
    ("Metro Ride CD 70 (Pre-Owned)", "Metro Ride", "used", 70, "Petrol", "4-Speed Manual", 112000, 2022, "used", "active", False, "5.5 hp (demo)", "52 km/l (demo)"),
    ("Kestrel K125 (Pre-Owned)", "Kestrel Bikes", "used", 125, "Petrol", "5-Speed Manual", 185000, 2021, "used", "active", False, "11 hp (demo)", "40 km/l (demo)"),
    ("Apex RX 250 (Pre-Owned)", "Apex Moto", "used", 250, "Petrol", "6-Speed Manual", 845000, 2023, "used", "active", True, "26 hp (demo)", "31 km/l (demo)"),
    ("Raptor Strike 200 (Pre-Owned)", "Raptor Motors", "used", 199, "Petrol", "6-Speed Manual", 560000, 2022, "used", "active", False, "24 hp (demo)", "34 km/l (demo)"),
    ("Nomad Drifter 350 (Pre-Owned)", "Nomad Cruisers", "used", 349, "Petrol", "5-Speed Manual", 1290000, 2024, "used", "active", False, "20 hp (demo)", "29 km/l (demo)"),
    ("Urban Glide Cruze 125 (Pre-Owned)", "Urban Glide", "used", 125, "Petrol", "CVT Automatic", 285000, 2023, "used", "active", False, "9 hp (demo)", "43 km/l (demo)"),
]

COLOR_SETS = {
    "sports": ["Racing Red", "Midnight Black", "Pearl White"],
    "commuter": ["Black", "Red", "Blue"],
    "standard": ["Matte Grey", "Gloss Black", "Burnt Orange"],
    "cruiser": ["Gunmetal", "Classic Black", "Desert Sand"],
    "touring": ["Titanium Silver", "Deep Black"],
    "scooter": ["Ivory", "Mint", "Graphite"],
    "scooty": ["Pastel Pink", "Sky Blue", "White"],
    "electric": ["Volt Green", "Arctic White", "Carbon Black"],
    "off-road": ["Trail Yellow", "Enduro Orange"],
    "used": ["As pictured"],
}

FEATURES = {
    "sports": ["Full fairing (demo)", "LED headlamp", "Digital TFT dash", "Dual-channel ABS (demo)", "Slipper clutch (demo)"],
    "commuter": ["Fuel-efficient engine", "Electric start (demo)", "Comfortable dual seat", "Low maintenance"],
    "standard": ["Upright ergonomics", "LED lighting", "Digital meter", "Front disc brake"],
    "cruiser": ["Low seat height", "Wide handlebar", "Chrome detailing", "Torque-rich engine"],
    "touring": ["Large windscreen", "Panniers ready", "Big fuel tank (demo)", "Cruise-friendly gearing"],
    "scooter": ["Under-seat storage", "CVT automatic", "USB charging port", "Floorboard space"],
    "scooty": ["Lightweight frame", "Low seat", "Automatic", "Easy for beginners"],
    "electric": ["Removable battery (demo)", "Regenerative braking", "Mobile app connectivity (demo)", "Zero tailpipe emissions"],
    "off-road": ["Long-travel suspension", "Knobby tyres", "High ground clearance", "Bash plate"],
    "used": ["Multi-point inspection (demo)", "Verified documents (demo)", "Service history available"],
}

CUSTOMERS = [
    ("Ahmed Raza", "Lahore"), ("Fatima Noor", "Lahore"), ("Bilal Khan", "Islamabad"),
    ("Ayesha Siddiqui", "Lahore"), ("Usman Tariq", "Faisalabad"), ("Hira Malik", "Lahore"),
    ("Zain Abbas", "Karachi"), ("Sana Javed", "Rawalpindi"), ("Hamza Ali", "Lahore"),
    ("Mariam Iqbal", "Multan"), ("Omar Farooq", "Lahore"), ("Nida Hussain", "Gujranwala"),
    ("Kashif Mehmood", "Lahore"), ("Rabia Aslam", "Sialkot"), ("Imran Shah", "Lahore"),
    ("Saad Qureshi", "Islamabad"), ("Amna Yousaf", "Lahore"), ("Faisal Rehman", "Sheikhupura"),
    ("Mehwish Butt", "Lahore"), ("Danish Akhtar", "Lahore"), ("Areeba Saleem", "Kasur"),
    ("Talha Nadeem", "Lahore"),
]

STAFF = [
    ("Demo Owner", "admin@demo-showroom.pk", "owner"),
    ("Sara Manager", "manager@demo-showroom.pk", "manager"),
    ("Ali Sales", "sales@demo-showroom.pk", "sales"),
    ("Noman Stock", "inventory@demo-showroom.pk", "inventory"),
    ("Hassan Sales", "hassan.sales@demo-showroom.pk", "sales"),
]


def build_seed() -> dict:
    rnd = random.Random(2026)
    today = date.today()

    collections: dict[str, list[dict]] = {k: [] for k in [
        "categories", "brands", "bikes", "inventory_units", "inventory_history", "customers",
        "bookings", "sales", "offers", "gallery", "banners", "testimonials", "faqs", "staff",
        "enquiries", "activity_logs",
    ]}

    # ---- Categories & brands -------------------------------------------------
    cat_by_slug = {}
    for i, (name, slug, desc, pool) in enumerate(CATEGORIES, start=1):
        rec = {"id": i, "name": name, "slug": slug, "description": desc, "image": img(pool, i),
               "order": i, "active": True, "created_at": _ts(today - timedelta(days=400))}
        collections["categories"].append(rec)
        cat_by_slug[slug] = rec

    brand_by_name = {}
    for i, (name, desc, color) in enumerate(BRANDS, start=1):
        rec = {"id": i, "name": name, "slug": name.lower().replace(" ", "-"), "description": desc,
               "origin": "Fictional demo brand", "color": color, "logo": "", "order": i, "active": True,
               "created_at": _ts(today - timedelta(days=400))}
        collections["brands"].append(rec)
        brand_by_name[name] = rec

    # ---- Bikes ----------------------------------------------------------------
    for i, b in enumerate(BIKES, start=1):
        name, brand, cat, cc, fuel, trans, price, year, cond, listing, featured, power, mileage = b
        pool = next(c[3] for c in CATEGORIES if c[1] == cat)
        if cat == "used":
            pool = {"Apex": "sports", "Raptor": "sports", "Nomad": "cruiser", "Urban": "scooter"}.get(name.split()[0], "commuter")
        slug = name.lower().replace("(", "").replace(")", "").replace(" ", "-")
        collections["bikes"].append({
            "id": i,
            "slug": slug,
            "name": name,
            "brand_id": brand_by_name[brand]["id"],
            "category_id": cat_by_slug[cat]["id"],
            "model_year": year,
            "price": price,
            "condition": cond,
            "listing_status": listing,
            "featured": featured,
            "engine_cc": cc,
            "fuel_type": fuel,
            "transmission": trans,
            "mileage": mileage,
            "max_power": power,
            "colors": COLOR_SETS[cat],
            "warranty": "Pre-owned: 3-month showroom warranty (demo)" if cond == "used" else "2 years / 20,000 km (demo terms)",
            "registration": ("Registered – transfer documents available (demo)" if cond == "used"
                             else "Unregistered – registration assistance available"),
            "odometer_km": rnd.randint(4000, 28000) if cond == "used" else 0,
            "description": (f"The {name} is a demonstration listing in our {cat_by_slug[cat]['name'].lower()} range. "
                            "All specifications shown are illustrative sample data, not manufacturer figures."),
            "features": FEATURES[cat],
            "images": gallery_for(pool, i),
            "low_stock_threshold": 1 if cond == "used" else 2,
            "views": rnd.randint(40, 900),
            "is_demo": True,
            "created_at": _ts(today - timedelta(days=rnd.randint(5, 300))),
            "updated_at": None,
        })

    # ---- Inventory units -------------------------------------------------------
    unit_id = 0

    def add_unit(bike, status="in_stock", added=None):
        nonlocal unit_id
        unit_id += 1
        cost = int(bike["price"] * rnd.uniform(0.82, 0.9) / 100) * 100
        unit = {
            "id": unit_id, "bike_id": bike["id"],
            "chassis_no": f"DEMO-CH-{100000 + unit_id * 37}",
            "engine_no": f"DEMO-EN-{500000 + unit_id * 53}",
            "color": rnd.choice(bike["colors"]), "condition": bike["condition"],
            "purchase_cost": cost, "status": status, "booking_id": None,
            "notes": "", "added_at": _ts(added or today - timedelta(days=rnd.randint(20, 200))),
            "updated_at": None,
        }
        collections["inventory_units"].append(unit)
        return unit

    for bike in collections["bikes"]:
        if bike["listing_status"] == "upcoming":
            continue
        if bike["condition"] == "used":
            count = 1
        elif bike["listing_status"] == "discontinued":
            count = 1
        else:
            count = rnd.randint(2, 7)
        for _ in range(count):
            add_unit(bike)
        # extra stock to be consumed by seeded sales
        if bike["condition"] == "new" and bike["listing_status"] == "active":
            for _ in range(rnd.randint(0, 2)):
                add_unit(bike)

    hist_id = 0

    def add_history(unit, action, from_s, to_s, note, when, actor="Seed data"):
        nonlocal hist_id
        hist_id += 1
        collections["inventory_history"].append({
            "id": hist_id, "unit_id": unit["id"], "bike_id": unit["bike_id"], "action": action,
            "from_status": from_s, "to_status": to_s, "note": note, "actor": actor,
            "timestamp": when,
        })

    for u in collections["inventory_units"]:
        add_history(u, "stock_added", None, "in_stock", "Initial demo stock", u["added_at"])

    # ---- Customers --------------------------------------------------------------
    for i, (name, city) in enumerate(CUSTOMERS, start=1):
        first = name.split()[0].lower()
        collections["customers"].append({
            "id": i, "name": name, "phone": f"0300{1000000 + i * 1371:07d}"[:11],
            "email": f"{first}.{i}@example.com", "city": city,
            "registered_at": _ts(today - timedelta(days=rnd.randint(10, 360))),
            "notes": "", "source": rnd.choice(["website", "walk-in", "referral"]),
            "password_hash": _hash("demo1234"), "is_demo": True,
        })

    # ---- Offers -----------------------------------------------------------------
    by_name = {b["name"]: b for b in collections["bikes"]}
    offers = [
        ("Festive Season Cashback", "Flat cashback on selected commuters this season (sample offer).", "fixed", 10000,
         [by_name["Kestrel K125"]["id"], by_name["Kestrel K125 Deluxe"]["id"], by_name["Metro Ride Star 110"]["id"]],
         -10, 30, True, img("commuter", 1)),
        ("Go Electric – 8% Off", "Introductory discount on Voltra electric models (sample offer).", "percent", 8,
         [by_name["Voltra Spark E1"]["id"], by_name["Voltra Pulse E3"]["id"], by_name["Voltra Bolt E-Moto"]["id"]],
         -5, 45, True, img("electric", 0)),
        ("Sportbike Weekend Deal", "Save on Apex RX range for a limited time (sample offer).", "percent", 5,
         [by_name["Apex RX 250"]["id"], by_name["Apex RX 400"]["id"]], -3, 14, True, img("sports", 0)),
        ("Scooter Starter Pack", "Free helmet & first service worth PKR 7,500 on scooters (sample offer – no price change).", "none", 0,
         [by_name["Urban Glide Cruze 125"]["id"], by_name["Urban Glide Maxi 150"]["id"]], -20, 20, True, img("scooter", 0)),
        ("Summer Clearance", "Expired demo campaign kept for history.", "fixed", 15000,
         [by_name["Raptor Roadster 250"]["id"]], -120, -60, True, img("standard", 0)),
        ("New Year Cruiser Fest", "Scheduled sample offer on cruisers.", "percent", 4,
         [by_name["Nomad Highway 500"]["id"], by_name["Nomad Classic 650"]["id"]], 40, 75, True, img("cruiser", 0)),
    ]
    for i, (title, desc, dtype, val, bike_ids, s, e, active, banner) in enumerate(offers, start=1):
        collections["offers"].append({
            "id": i, "title": title, "description": desc, "discount_type": dtype, "discount_value": val,
            "bike_ids": bike_ids, "applies_to_all": False,
            "start_date": (today + timedelta(days=s)).isoformat(), "end_date": (today + timedelta(days=e)).isoformat(),
            "banner": banner, "active": active, "highlight": i <= 3, "is_demo": True,
            "created_at": _ts(today + timedelta(days=min(s, 0) - 2)),
        })

    # ---- Sales ------------------------------------------------------------------
    sale_id = 0
    methods = ["cash", "bank_transfer", "card", "installment", "cheque"]
    sellable = [u for u in collections["inventory_units"]]
    rnd.shuffle(sellable)
    bikes_by_id = {b["id"]: b for b in collections["bikes"]}
    sold_target = 30
    for u in sellable:
        if sale_id >= sold_target:
            break
        bike = bikes_by_id[u["bike_id"]]
        if bike["listing_status"] != "active":
            continue
        same_bike_stock = [x for x in collections["inventory_units"] if x["bike_id"] == bike["id"] and x["status"] == "in_stock"]
        if len(same_bike_stock) <= 1 and bike["condition"] == "new":
            continue  # keep at least one in stock for most new models
        days_ago = rnd.randint(1, 175)
        sdate = today - timedelta(days=days_ago)
        customer = rnd.choice(collections["customers"])
        list_price = bike["price"]
        discount = rnd.choice([0, 0, 0, 5000, 10000, int(list_price * 0.03 / 100) * 100])
        selling = list_price - discount
        roll = rnd.random()
        if days_ago > 30 or roll < 0.55:
            paid = selling
        elif roll < 0.85:
            paid = int(selling * rnd.choice([0.3, 0.5, 0.6]) / 100) * 100
        else:
            paid = 0
        payments = []
        if paid:
            payments.append({"amount": paid, "date": sdate.isoformat(), "method": rnd.choice(methods), "note": "Demo payment"})
        sale_id += 1
        status = "paid" if paid >= selling else ("partially_paid" if paid else "unpaid")
        sale = {
            "id": sale_id, "invoice_no": f"INV-{sdate.year}-{1000 + sale_id}",
            "customer_id": customer["id"], "bike_id": bike["id"], "unit_id": u["id"], "booking_id": None,
            "sale_date": sdate.isoformat(), "list_price": list_price, "discount": discount,
            "discount_note": "Showroom discount (demo)" if discount else "",
            "selling_price": selling, "payments": payments, "amount_paid": paid, "balance": selling - paid,
            "payment_status": status, "payment_method": payments[0]["method"] if payments else "cash",
            "delivery_status": "delivered" if days_ago > 7 else rnd.choice(["pending", "ready", "delivered"]),
            "status": "completed", "archived": False, "reversal": None, "notes": "",
            "sold_by": rnd.choice(["Ali Sales", "Hassan Sales", "Sara Manager"]),
            "is_demo": True, "created_at": _ts(sdate, 15),
        }
        collections["sales"].append(sale)
        u["status"] = "sold"
        u["updated_at"] = _ts(sdate, 15)
        add_history(u, "sold", "in_stock", "sold", f"Sold on {sale['invoice_no']}", _ts(sdate, 15))

    # ---- Bookings ---------------------------------------------------------------
    types = ["test_ride", "test_ride", "showroom_visit", "purchase_enquiry"]
    active_bikes = [b for b in collections["bikes"] if b["listing_status"] == "active"]
    for i in range(1, 37):
        offset = rnd.randint(-75, 16)
        bdate = today + timedelta(days=offset)
        customer = rnd.choice(collections["customers"])
        bike = rnd.choice(active_bikes)
        if offset < -2:
            status = rnd.choice(["completed", "completed", "completed", "contacted", "rejected", "cancelled"])
        elif offset < 1:
            status = rnd.choice(["confirmed", "contacted", "completed"])
        else:
            status = rnd.choice(["pending", "pending", "confirmed", "contacted"])
        created = min(bdate - timedelta(days=rnd.randint(1, 6)), today)
        btype = rnd.choice(types)
        history = [{"from": None, "to": "pending", "note": "Booking submitted", "actor": "Customer", "at": _ts(created, 9)}]
        if status != "pending":
            history.append({"from": "pending", "to": status, "note": "Updated by staff (demo)", "actor": "Sara Manager",
                            "at": _ts(min(created + timedelta(days=1), today), 12)})
        collections["bookings"].append({
            "id": i, "reference": f"BK-{created.strftime('%y%m')}-{1000 + i * 7}",
            "bike_id": bike["id"], "customer_id": customer["id"], "name": customer["name"],
            "phone": customer["phone"], "email": customer["email"], "booking_type": btype,
            "preferred_date": bdate.isoformat(), "preferred_time": rnd.choice(["10:30", "12:00", "14:00", "16:30", "18:00"]),
            "message": rnd.choice(["", "Please keep the bike ready.", "Interested in installment options.", "Will come with a friend."]),
            "status": status, "notes": [], "status_history": history,
            "created_at": _ts(created, 9), "updated_at": history[-1]["at"],
        })

    # ---- Content collections ---------------------------------------------------
    gallery_items = [
        ("Showroom floor", "showroom", "standard"), ("Sports bike lineup", "bikes", "sports"),
        ("Cruiser corner", "bikes", "cruiser"), ("Delivery day", "events", "commuter"),
        ("Electric zone", "bikes", "electric"), ("Weekend ride-out", "events", "touring"),
        ("Service bay", "showroom", "offroad"), ("Scooter display", "bikes", "scooter"),
    ]
    for i, (title, cat, pool) in enumerate(gallery_items, start=1):
        collections["gallery"].append({"id": i, "title": title, "caption": f"{title} – demo photo", "category": cat,
                                       "image": img(pool, i), "order": i, "visible": True})

    collections["banners"] = [
        {"id": 1, "title": "Electric Season is Here", "subtitle": "Explore the Voltra range with sample launch pricing.",
         "image": img("electric", 1), "cta_label": "View Electric", "cta_link": "/categories/electric", "visible": True, "order": 1},
        {"id": 2, "title": "Book a Free Test Ride", "subtitle": "Feel the difference before you buy – slots open daily.",
         "image": img("sports", 2), "cta_label": "Book Now", "cta_link": "/book", "visible": True, "order": 2},
    ]

    testimonials = [
        ("Ahmed R.", "Lahore", 5, "Smooth buying experience and the team explained every detail. Delivery was on time.", "Kestrel K125"),
        ("Fatima N.", "Lahore", 5, "Booked a test ride online and it was ready when I arrived. Very professional.", "Urban Glide Cruze 125"),
        ("Bilal K.", "Islamabad", 4, "Good range of sports bikes and fair pricing. Paperwork was handled quickly.", "Apex RX 250"),
        ("Hira M.", "Lahore", 5, "Switched to electric and the staff helped me understand charging and range.", "Voltra Spark E1"),
        ("Usman T.", "Faisalabad", 4, "Bought a pre-owned bike – it was inspected and exactly as described.", "Raptor Strike 200 (Pre-Owned)"),
    ]
    for i, (n, c, r, t, b) in enumerate(testimonials, start=1):
        collections["testimonials"].append({"id": i, "name": n, "city": c, "rating": r, "text": t,
                                            "bike_label": b, "visible": True, "order": i, "is_demo": True})

    faqs = [
        ("Can I book a test ride online?", "Yes. Choose a motorcycle, pick a date and time, and submit the booking form. You will receive a booking reference to track the status."),
        ("Do you offer installment plans?", "Installment options can be discussed with our sales team during your visit. Terms shown on this demo site are samples."),
        ("Are pre-owned bikes inspected?", "Every pre-owned listing in this demo is marked as inspected. In production, attach the real inspection report."),
        ("What documents do I need to buy a motorcycle?", "Typically a valid CNIC copy and contact details. Registration assistance is available at the showroom."),
        ("Does booking a test ride reserve the bike?", "No. A booking is a request. Stock is only reserved or sold by showroom staff after confirmation."),
        ("Do electric bikes come with a charger?", "Demo electric listings include a standard charger. Confirm actual inclusions with the showroom."),
    ]
    for i, (q, a) in enumerate(faqs, start=1):
        collections["faqs"].append({"id": i, "question": q, "answer": a, "visible": True, "order": i})

    for i, (name, email, role) in enumerate(STAFF, start=1):
        collections["staff"].append({
            "id": i, "name": name, "email": email, "phone": f"0321{2000000 + i * 911:07d}"[:11], "role": role,
            "active": True, "joined_at": (today - timedelta(days=200 + i * 40)).isoformat(), "is_demo": True,
        })

    enquiries = [
        ("Kashif Mehmood", "Installment plan", "Do you offer 12-month installments on the Apex RX 250?", "new"),
        ("Rabia Aslam", "Electric bike charging", "How long does the Voltra Pulse E3 take to charge?", "in_progress"),
        ("Saad Qureshi", "Trade-in", "Can I trade in my old 70cc bike?", "resolved"),
        ("Amna Yousaf", "Scooty colours", "Which colours are available for the Pixie 50?", "new"),
    ]
    for i, (name, subject, msg, status) in enumerate(enquiries, start=1):
        cust = next(c for c in collections["customers"] if c["name"] == name)
        collections["enquiries"].append({
            "id": i, "name": name, "phone": cust["phone"], "email": cust["email"], "subject": subject,
            "message": msg, "status": status, "notes": "", "created_at": _ts(today - timedelta(days=i * 3), 14),
        })

    activity = [
        ("seed", "system", None, "Demo dataset loaded"),
        ("update", "offer", 2, "Activated offer 'Go Electric – 8% Off'"),
        ("update", "booking", 3, "Booking status changed to confirmed"),
        ("create", "bike", 24, "Added motorcycle 'Voltra Bolt E-Moto'"),
    ]
    for i, (action, entity, eid, desc) in enumerate(activity, start=1):
        collections["activity_logs"].append({
            "id": i, "action": action, "entity": entity, "entity_id": eid, "description": desc,
            "actor": "Seed data" if action == "seed" else "Sara Manager",
            "timestamp": _ts(today - timedelta(days=5 - i), 10 + i),
        })

    # ---- Documents ---------------------------------------------------------------
    featured_ids = [b["id"] for b in collections["bikes"] if b["featured"]][:8]
    documents = {
        "content": {
            "hero": {
                "eyebrow": "Premium Motorcycle Showroom",
                "title": "Ride Beyond the Ordinary",
                "highlight": "Ordinary",
                "subtitle": "Discover sports bikes, cruisers, scooters and electric rides – hand-picked, inspected and ready for the road.",
                "image": img("sports", 0),
                "primary_cta": {"label": "Explore Bikes", "link": "/bikes"},
                "secondary_cta": {"label": "Book a Test Ride", "link": "/book"},
                "tertiary_cta": {"label": "Contact Us", "link": "/contact"},
            },
            "featured_bike_ids": featured_ids,
            "intro": {
                "title": "A showroom built around riders",
                "text": "From your first commuter to a long-distance tourer, our team helps you choose, test and own the right motorcycle. This website runs on sample data for demonstration.",
            },
            "highlights": [
                {"label": "Models on display", "value": 30, "suffix": "+"},
                {"label": "Happy riders (demo)", "value": 4800, "suffix": "+"},
                {"label": "Brands", "value": 8, "suffix": ""},
                {"label": "Years of service (demo)", "value": 12, "suffix": ""},
            ],
            "home_sections": {
                "featured": True, "latest": True, "brands": True, "offers": True, "used": True, "electric": True,
                "scooters": True, "best_sellers": True, "testimonials": True, "highlights": True, "faqs": True, "banners": True,
            },
            "about": {
                "title": "About RevZone Motors",
                "story": "RevZone Motors is a demonstration dealership created to showcase a complete showroom management platform. Replace this text with your real story from the admin panel.",
                "mission": "Make motorcycle ownership simple, transparent and enjoyable for every rider.",
                "vision": "To be the most trusted two-wheeler destination – online and in the showroom.",
                "image": img("standard", 1),
            },
            "contact": {
                "phones": ["0300-0000000 (demo)", "042-0000000 (demo)"],
                "whatsapp": "923000000000",
                "email": "hello@demo-showroom.pk",
                "address": "Showroom address placeholder – set the real address in Admin → Content",
                "city": "Demo City",
                "map_embed_url": "",
                "map_query": "",
                "hours": [
                    {"day": "Monday – Saturday", "time": "10:00 AM – 8:00 PM"},
                    {"day": "Sunday", "time": "12:00 PM – 6:00 PM"},
                ],
            },
            "social": {"facebook": "https://facebook.com", "instagram": "https://instagram.com",
                       "youtube": "https://youtube.com", "tiktok": "", "twitter": ""},
            "footer": {"text": "Premium motorcycles, scooters and electric rides. Demo website – all products, prices and data are samples.",
                       "copyright": "RevZone Motors (Demo)"},
        },
        "settings": {
            "business_name": "RevZone Motors",
            "tagline": "Premium Motorcycle Showroom",
            "logo_text": "REVZONE",
            "logo_url": "",
            "currency": "PKR",
            "default_theme": "dark",
            "invoice_prefix": "INV",
            "invoice_terms": "1. Prices are inclusive of showroom delivery within city limits (demo terms).\n2. Registration charges are payable separately unless stated.\n3. Balance must be cleared before delivery.\n4. This is a demonstration invoice and has no legal value.",
            "invoice_footer": "Thank you for riding with us!",
            "default_low_stock_threshold": 2,
            "booking_open_time": "10:00",
            "booking_close_time": "20:00",
        },
    }

    return {"collections": collections, "documents": documents}
