from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import urllib.request
import json
import re
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    stdnum = db.Column(db.String(20), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

posts = []

with app.app_context():
    db.create_all()

@app.route('/register', methods=['POST'])
def register():
    data = request.json

    if User.query.filter((User.stdnum == data['stdnum']) | (User.username == data['username'])).first():
        return jsonify({'error': '이미 존재하는 학번 또는 아이디입니다.'}), 400

    hashed_password = generate_password_hash(data['password'])

    new_user = User(
        name=data['name'],
        stdnum=data['stdnum'],
        username=data['username'],
        password=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': '회원가입이 성공적으로 완료되었습니다!'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': '아이디와 비밀번호를 모두 입력해주세요.'}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': '아이디 또는 비밀번호가 일치하지 않습니다.'}), 401
    return jsonify(), 200

@app.route('/search', methods=['GET'])
def search_books():
    client_id = "c2hEZoHKeKZ3npRYxfkj"
    client_secret = "TzDf0c5AjH"
    query = request.args.get('query', '')
    display = 10
    start = 1

    url = f"https://openapi.naver.com/v1/search/book?query={urllib.parse.quote(query)}&display={display}&start={start}"
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", client_id)
    req.add_header("X-Naver-Client-Secret", client_secret)

    try:
        response = urllib.request.urlopen(req)
        if response.getcode() == 200:
            response_body = response.read()
            response_dict = json.loads(response_body.decode('utf-8'))
            for item in response_dict['items']:
                item['title'] = re.sub('<.*?>', '', item['title'])
                item['description'] = re.sub('<.*?>', '', item['description'])
            return jsonify(response_dict['items'])
        else:
            return jsonify({'error': 'Failed to fetch data'}), response.getcode()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_book():
    title = request.form.get('title')
    author = request.form.get('author')
    price = request.form.get('price')
    image = request.files.get('image')

    if not all([title, author, price, image]):
        return jsonify({'error': '모든 필드를 입력해주세요'}), 400

    image_path = os.path.join(app.config['UPLOAD_FOLDER'], image.filename)
    image.save(image_path)

    post = {
        'title': title,
        'author': author,
        'price': price,
        'image': image_path
    }
    posts.append(post)

    return jsonify({'message': '게시글을 업로드하였습니다.', 'post': post})

@app.route('/posts', methods=['GET'])
def get_posts():
    client_id = "c2hEZoHKeKZ3npRYxfkj"
    client_secret = "TzDf0c5AjH"

    enriched_posts = []
    for post in posts:
        naver_price = "가격 정보 없음"
        query = urllib.parse.quote(post['title'])

        # 네이버 API 호출
        url = f"https://openapi.naver.com/v1/search/book?query={query}&display=1&start=1"
        req = urllib.request.Request(url)
        req.add_header("X-Naver-Client-Id", client_id)
        req.add_header("X-Naver-Client-Secret", client_secret)

        try:
            response = urllib.request.urlopen(req)
            if response.getcode() == 200:
                response_body = response.read()
                response_dict = json.loads(response_body.decode('utf-8'))
                print(f"API Response for {post['title']}: {response_dict}")  # 디버깅용
                if response_dict['items']:
                    # 할인 가격 가져오기
                    naver_price = response_dict['items'][0].get('discount', "가격 정보 없음")
        except Exception as e:
            print(f"Error fetching price from Naver API for {post['title']}: {str(e)}")

        # 게시글에 네이버 최저가 추가
        enriched_post = {
            **post,
            'naver_price': naver_price
        }
        enriched_posts.append(enriched_post)

    return jsonify(enriched_posts)

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True)