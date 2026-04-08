# Professional Deployment Guide: Life OS on AWS (EC2 + Docker)

This guide provides a professional, step-by-step workflow to deploy your **Life OS** application to the cloud using **AWS (Amazon Web Services)** and **Docker**. This is the standard industry approach for "Infrastructure as Code" and containerized deployments.

---

## Phase 1: Local Preparation (Your Machine)

Before moving to the cloud, we must ensure your application is "Containerized." This means it can run anywhere that has Docker installed.

### 1. Install Docker Desktop
- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- Verify installation by running:
  ```bash
  docker --version
  ```

### 2. Test the Docker Build Locally
We use the `Dockerfile` located in `apps/web/Dockerfile`. Run this from the root of your project:
```bash
# Build the image (Replace YOUR_CLERK_KEY with your actual public key)
docker build -t life-os-web \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... \
  ./apps/web

# Run the container to test
docker run -p 3000:3000 life-os-web
```
Visit `localhost:3000` to confirm it works.

---

## Phase 2: AWS Infrastructure Setup

### 1. Create an AWS Account
- Sign up for the [AWS Free Tier](https://aws.amazon.com/free/).

### 2. Launch an EC2 Instance (The Virtual Server)
1. Go to the **EC2 Dashboard** and click **Launch Instance**.
2. **Name**: `Life-OS-Production`.
3. **OS**: Choose **Ubuntu 22.04 LTS** (Industry standard for web servers).
4. **Instance Type**: `t2.micro` (Free Tier eligible).
5. **Key Pair**: Create a new key pair (e.g., `life-os-key.pem`). **Download and save this safely!**
6. **Network Settings**:
   - Allow **SSH** (Port 22) - for your access.
   - Allow **HTTPS** (Port 443) - for public web traffic.
   - Allow **HTTP** (Port 80) - for public web traffic.
   - *Custom Rule*: Add Port **3000** (if you want direct access).

---

## Phase 3: Server Configuration (Connecting to AWS)

### 1. SSH into your Server
Open your terminal on your Mac and run:
```bash
chmod 400 life-os-key.pem
ssh -i "life-os-key.pem" ubuntu@your-ec2-public-ip
```

### 2. Install Docker on the EC2 Server
Once logged into the server, run these commands:
```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
# Allow your user to run docker without 'sudo'
sudo usermod -aG docker ubuntu
# Log out and log back in for changes to take effect
exit
ssh -i "life-os-key.pem" ubuntu@your-ec2-public-ip
```

---

## Phase 4: Deploying Your Code

### 1. Clone your Repository on the Server
```bash
git clone https://github.com/naman293/Life-OS.git
cd Life-OS
```

### 2. Set up Environment Variables
Professional apps use a `.env` file on the server. Create one in `apps/web/`:
```bash
nano apps/web/.env
```
Paste your secrets (Clerk keys, Database URLs, etc.) and save (`Ctrl+O`, `Enter`, `Ctrl+X`).

### 3. Build and Run with Docker Compose
We use `docker-compose` to manage the lifecycle of your app:
```bash
docker-compose up -d --build
```
The `-d` flag runs it in "detached mode" (background), so the app stays alive after you close the terminal.

---

## Phase 5: Domain & SSL (The Final Professional Touch)

To access your app via a real domain (e.g., `app.lifeos.com`) instead of an IP address:

1. **Point your Domain**: In your domain provider (GoDaddy/Namecheap), create an `A Record` pointing to your EC2 Public IP.
2. **Install Nginx**: Use Nginx as a "Reverse Proxy" to handle traffic from Port 80 to your Docker container on Port 3000.
3. **SSL (HTTPS)**: Use **Certbot (Let's Encrypt)** to get a free SSL certificate.
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Summary of Commands for Future Use
- `docker ps`: See running containers.
- `docker logs -f [container_id]`: See live logs (debug).
- `git pull && docker-compose up -d --build`: Update your app with new code.

> [!TIP]
> **Professional Secret**: In a real company, you would use a "CI/CD Pipeline" (like GitHub Actions) to automate Phase 4, so every time you `git push`, the server updates itself automatically!
