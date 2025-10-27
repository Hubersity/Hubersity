pipeline {
    agent any

    environment {
        VENV_DIR = 'venv'
        PYTHON = "${VENV_DIR}/bin/python"
        PIP = "${VENV_DIR}/bin/pip"
        ACTIVATE = ". ${VENV_DIR}/bin/activate"
    }

    stages {
        stage('Checkout') {
            steps {
                git([branch: 'backend/add_testing', url: 'https://github.com/Hubersity/Hubersity.git'])
            }
        }

        stage('Setup Python Environment') {
            steps {
                sh '''
                python3 -m venv ${VENV_DIR}
                ${ACTIVATE}
                ${PIP} install --upgrade pip setuptools wheel
                ${PIP} install -r backend/requirements.txt
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                ${ACTIVATE}
                export PYTHONPATH=backend
                pytest backend/tests \
                    -v \
                    --maxfail=1 \
                    --disable-warnings \
                    --cov=backend/app \
                    --cov-report=xml \
                    --junitxml=test-results.xml
                '''
            }
        }
    }

    post {
        always {
            junit 'test-results.xml'
            cobertura autoUpdateHealth: false, autoUpdateStability: false, coberturaReportFile: 'coverage.xml'
        }

        failure {
            echo '❌ Tests failed! Check the console and test-results.xml for details.'
        }

        success {
            echo '✅ All tests passed successfully!'
        }
    }
}