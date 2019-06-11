properties([pipelineTriggers([cron('H 3 * * 1-5')])])

def label = "mjml-${UUID.randomUUID().toString()}"

lock("${env.JOB_NAME}") {
  podTemplate(
    label: label,
    yaml: """
      spec:
        tolerations:
        - key: "onWhen"
          operator: "Equal"
          value: "onlyDuringBusinessDay"
          effect: "NoSchedule"
    """,
    containers: [
      containerTemplate(
        name: 'jnlp',
        image: 'eu.gcr.io/resources-144712/jenkins-k8s-slave:latest',
        alwaysPullImage: true,
        resourceRequestCpu: '450m',
        resourceRequestMemory: '1000Mi',
        resourceLimitMemory: '1000Mi',
        args: '${computer.jnlpmac} ${computer.name}'
      )
    ],
    nodeUsageMode: 'EXCLUSIVE',
    volumes: [
      hostPathVolume(hostPath: '/var/run/docker.sock', mountPath: '/var/run/docker.sock')
    ]
  )
  {
    node(label) {

      def PHP_IMAGE_TAG   = "eu.gcr.io/${PROJECT}/php-api"

      def VERSION_DOCKER = "develop.${env.BUILD_NUMBER}"

      try {

        checkout scm

        stage("dockerhub registry login") {
          withCredentials([usernamePassword(credentialsId: 'dockerhub_of2m', usernameVariable: 'CI_REGISTRY_USER', passwordVariable: 'CI_REGISTRY_PASSWORD')]) {
            sh '''
              if test "$CI_REGISTRY_USER" != "" -a "$CI_REGISTRY_PASSWORD" != ""
              then
                docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD"
              else
                echo "ERROR get Credentials CI_REGISTRY_USER=$CI_REGISTRY_USER"
                exit 1
              fi
            '''
          }
        }


        stage('build') {
          def customImage = docker.build("of2m/mjml-server")
          customImage.push('latest')
          customImage.push("${VERSION_DOCKER}")
        }
      }
      catch (e) {
        currentBuild.result = "FAILED"
        throw e
      }
      finally {
        step([$class: 'Mailer', notifyEveryUnstableBuild: true, recipients: 'dsi@of2m.fr', sendToIndividuals: false])
      }
    }
  }
}