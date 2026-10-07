FROM alpine:latest
RUN apk add --no-cache ca-certificates unzip wget
ARG PB_VERSION=0.22.27
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -O /tmp/pb.zip \
    && unzip /tmp/pb.zip -d /pb/ \
    && rm /tmp/pb.zip
EXPOSE 8090
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--publicDir=/pb/pb_public"]
